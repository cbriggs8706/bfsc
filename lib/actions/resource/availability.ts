// lib/action/resource/availability.ts
'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { and, eq, lt, gt, ne } from 'drizzle-orm'
import { db, reservations, resources } from '@/db'
import {
	operatingHours,
	specialHours,
	weeklyShifts,
} from '@/db/schema/tables/shifts'
import type { AvailabilityResponse, TimeSlot } from '@/types/resource'
import { addMinutes } from 'date-fns'
import {
	toHHMMInTz,
	toUtcDateTimeInTz,
	weekdayFromYYYYMMDD,
} from '@/utils/time'
import { getCenterTimeConfig } from '@/lib/time/center-time'
// import { inArray } from 'drizzle-orm'

type Args = {
	resourceId: string
	date: string // YYYY-MM-DD
	excludeReservationId?: string
	stepMinutes?: number // default = 15
}

export async function getAvailability({
	resourceId,
	date,
	excludeReservationId,
	stepMinutes = 15,
}: Args): Promise<AvailabilityResponse> {
	noStore()
	const centerTime = await getCenterTimeConfig()

	if (!resourceId) throw new Error('Missing resourceId')
	if (!date) throw new Error('Missing date')

	/* ---------------------------------------------
	 * 1) Load resource
	 * ------------------------------------------- */

	const r = await db.query.resources.findFirst({
		where: eq(resources.id, resourceId),
		columns: {
			id: true,
			defaultDurationMinutes: true,
			capacity: true,
		},
	})

	if (!r) throw new Error('Resource not found')

	/* ---------------------------------------------
	 * 2) Determine open/close window
	 *    specialHours override operatingHours
	 * ------------------------------------------- */

	const weekday = weekdayFromYYYYMMDD(date)
	const special = await db.query.specialHours.findFirst({
		where: eq(specialHours.date, date),
	})
	if (special?.isClosed) {
		return {
			resourceId,
			date,
			status: 'closed',
			defaultDurationMinutes: r.defaultDurationMinutes,
			capacity: r.capacity,
			opensAt: special.opensAt ?? null,
			closesAt: special.closesAt ?? null,
			timeSlots: [],
		}
	}

	const shifts = await db.query.weeklyShifts.findMany({
		where: and(
			eq(weeklyShifts.weekday, weekday),
			eq(weeklyShifts.isActive, true)
		),
		orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.startTime)],
	})

	const hasRegularShifts = shifts.some((s) => s.type === 'regular')
	// const hasAppointmentShifts = shifts.some((s) => s.type === 'appointment')

	let isClosed = false
	let opensAt: string | null = null
	let closesAt: string | null = null

	if (shifts.length === 0) {
		return {
			resourceId,
			date,
			status: 'closed',
			defaultDurationMinutes: r.defaultDurationMinutes,
			capacity: r.capacity,
			opensAt,
			closesAt,
			timeSlots: [],
		}
	}

	if (special) {
		if (special.isClosed) {
			isClosed = true
		} else {
			opensAt = special.opensAt ?? null
			closesAt = special.closesAt ?? null
		}
	}

	const op = await db.query.operatingHours.findFirst({
		where: eq(operatingHours.weekday, weekday),
	})

	// operating hours only define REGULAR shift bounds
	if (op && !op.isClosed) {
		opensAt = opensAt ?? op.opensAt
		closesAt = closesAt ?? op.closesAt
	}

	// 🚨 DO NOT mark closed here

	if (
		isClosed ||
		shifts.length === 0 ||
		(hasRegularShifts && (!opensAt || !closesAt))
	) {
		return {
			resourceId,
			date,
			status: 'closed',
			defaultDurationMinutes: r.defaultDurationMinutes,
			capacity: r.capacity,
			opensAt,
			closesAt,
			timeSlots: [],
		}
	}

	/* ---------------------------------------------
	 * 3) Convert open window to Date objects
	 * ------------------------------------------- */

	const openDt =
		hasRegularShifts && opensAt
			? toUtcDateTimeInTz(date, opensAt, centerTime.timeZone)
			: null

	const closeDt =
		hasRegularShifts && closesAt
			? toUtcDateTimeInTz(date, closesAt, centerTime.timeZone)
			: null

	/* ---------------------------------------------
	 * 4) Fetch overlapping reservations
	 * ------------------------------------------- */

	const reservationWhere = and(
		eq(reservations.resourceId, resourceId),

		// Only apply open/close window when regular shifts exist
		hasRegularShifts && openDt && closeDt
			? and(
					lt(reservations.startTime, closeDt),
					gt(reservations.endTime, openDt)
			  )
			: undefined,

		ne(reservations.status, 'cancelled'),
		ne(reservations.status, 'denied'),

		excludeReservationId ? ne(reservations.id, excludeReservationId) : undefined
	)

	const existing = await db.query.reservations.findMany({
		where: reservationWhere,
		columns: {
			startTime: true,
			endTime: true,
			attendeeCount: true,
		},
	})

	/* ---------------------------------------------
	 * 5) Generate time slots
	 * ------------------------------------------- */

	const duration = r.defaultDurationMinutes
	const slots: TimeSlot[] = []

	for (const shift of shifts) {
		const rawStart = toUtcDateTimeInTz(date, shift.startTime, centerTime.timeZone)
		const rawEnd = toUtcDateTimeInTz(date, shift.endTime, centerTime.timeZone)

		const shiftStart =
			shift.type === 'appointment'
				? rawStart
				: openDt && rawStart < openDt
				? openDt
				: rawStart

		const shiftEnd =
			shift.type === 'appointment'
				? rawEnd
				: closeDt && rawEnd > closeDt
				? closeDt
				: rawEnd

		if (shiftEnd <= shiftStart) continue

		let cursor = new Date(shiftStart)

		while (true) {
			const end = addMinutes(cursor, duration)
			if (end > shiftEnd) break

			const used = usedCapacity(cursor, end, existing)

			let isAvailable: boolean
			let reason: string | undefined

			if (r.capacity == null) {
				isAvailable = used === 0
			} else {
				isAvailable = r.capacity - used > 0
				if (!isAvailable) reason = 'At capacity'
			}

			slots.push({
				startTime: toHHMMInTz(cursor, centerTime.timeZone),
				endTime: toHHMMInTz(end, centerTime.timeZone),
				isAvailable,
				reason,
				shiftType: shift.type,
				weeklyShiftId: shift.id,
			})

			cursor = addMinutes(cursor, stepMinutes)
		}
	}
	/* ---------------------------------------------
	 * 6) De-duplicate overlapping slots
	 *    Prefer REGULAR over APPOINTMENT
	 * ------------------------------------------- */

	const uniqueSlots = new Map<string, TimeSlot>()

	for (const s of slots) {
		const key = `${s.startTime}-${s.endTime}`
		const existing = uniqueSlots.get(key)

		if (!existing) {
			uniqueSlots.set(key, s)
			continue
		}

		// If either slot is regular, the result is regular
		if (existing.shiftType === 'regular' || s.shiftType === 'regular') {
			uniqueSlots.set(key, {
				...existing,
				shiftType: 'regular',
				weeklyShiftId: existing.weeklyShiftId ?? s.weeklyShiftId,
			})
		}
		// else both are appointment → keep appointment
	}

	const finalSlots = Array.from(uniqueSlots.values())

	return {
		resourceId,
		date,
		status: 'open',
		defaultDurationMinutes: duration,
		capacity: r.capacity,
		opensAt,
		closesAt,
		timeSlots: finalSlots.filter((s) => s.isAvailable),
	}
}

/* =================================================
 * Helpers
 * ================================================= */

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
	return aStart < bEnd && aEnd > bStart
}

function usedCapacity(
	slotStart: Date,
	slotEnd: Date,
	reservations: {
		startTime: Date
		endTime: Date
		attendeeCount: number
	}[]
) {
	return reservations.reduce((sum, r) => {
		if (overlaps(slotStart, slotEnd, r.startTime, r.endTime)) {
			return sum + (r.attendeeCount ?? 1)
		}
		return sum
	}, 0)
}
