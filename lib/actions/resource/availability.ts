// lib/action/resource/availability.ts
'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { and, eq, lt, gt, ne } from 'drizzle-orm'
import { db, reservation, resource } from '@/db'
import { operatingHours, specialHours } from '@/db/schema/tables/shifts'
import type { AvailabilityResponse, TimeSlot } from '@/types/resource'
import { addMinutes } from 'date-fns'
import { toHHMM, toLocalDateTime, weekdayFromYYYYMMDD } from '@/utils/time'

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

	if (!resourceId) throw new Error('Missing resourceId')
	if (!date) throw new Error('Missing date')

	/* ---------------------------------------------
	 * 1) Load resource
	 * ------------------------------------------- */

	const r = await db.query.resource.findFirst({
		where: eq(resource.id, resourceId),
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

	let isClosed = false
	let opensAt: string | null = null
	let closesAt: string | null = null

	if (special) {
		if (special.isClosed) {
			isClosed = true
		} else {
			opensAt = special.opensAt ?? null
			closesAt = special.closesAt ?? null
		}
	}

	if (!special || (!isClosed && (!opensAt || !closesAt))) {
		const op = await db.query.operatingHours.findFirst({
			where: eq(operatingHours.weekday, weekday),
		})

		if (!op || op.isClosed) {
			isClosed = true
		} else {
			opensAt = op.opensAt
			closesAt = op.closesAt
		}
	}

	if (isClosed || !opensAt || !closesAt) {
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

	const openDt = toLocalDateTime(date, opensAt)
	const closeDt = toLocalDateTime(date, closesAt)

	/* ---------------------------------------------
	 * 4) Fetch overlapping reservations
	 * ------------------------------------------- */

	const existing = await db.query.reservation.findMany({
		where: and(
			eq(reservation.resourceId, resourceId),

			// overlaps the open window
			lt(reservation.startTime, closeDt),
			gt(reservation.endTime, openDt),

			ne(reservation.status, 'cancelled'),
			ne(reservation.status, 'denied'),

			excludeReservationId
				? ne(reservation.id, excludeReservationId)
				: undefined
		),
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

	let cursor = new Date(openDt)

	while (true) {
		const end = addMinutes(cursor, duration)
		if (end > closeDt) break

		const used = usedCapacity(cursor, end, existing)

		let isAvailable: boolean
		let reason: string | undefined

		if (r.capacity == null) {
			// capacity does not apply → any overlap blocks
			isAvailable = used === 0
			reason = isAvailable ? undefined : 'Reserved'
		} else {
			const remaining = Math.max(r.capacity - used, 0)
			isAvailable = remaining > 0
			reason = isAvailable ? undefined : 'At capacity'
		}

		slots.push({
			startTime: toHHMM(cursor),
			endTime: toHHMM(end),
			isAvailable,
			reason,
		})

		cursor = addMinutes(cursor, stepMinutes)
	}

	return {
		resourceId,
		date,
		status: 'open',
		defaultDurationMinutes: duration,
		capacity: r.capacity,
		opensAt,
		closesAt,
		timeSlots: slots.filter((s) => s.isAvailable),
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
