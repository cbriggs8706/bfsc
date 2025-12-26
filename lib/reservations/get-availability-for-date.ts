// lib/reservations/get-availability-for-date.ts
import { db } from '@/db'
import { resources } from '@/db/schema/tables/resource'
import { reservations } from '@/db'
import { operatingHours, specialHours } from '@/db/schema/tables/shifts'
import { and, eq, gt, inArray, lt, sql } from 'drizzle-orm'
import type { AvailabilityResponse, TimeSlot } from '@/types/resource'
import { minutesToTime, toMinutes } from './time'

type Params = {
	resourceId: string
	date: string // YYYY-MM-DD (local center date)
}

function assertTimeString(t: string): void {
	// very small guard; keeps you from weird empty/invalid times
	if (!/^\d{2}:\d{2}$/.test(t)) {
		throw new Error(`Invalid time string: ${t}`)
	}
}

export async function getAvailabilityForDate(
	params: Params
): Promise<AvailabilityResponse> {
	const { resourceId, date } = params

	// 1) Load resource
	const resource = await db.query.resources.findFirst({
		where: eq(resources.id, resourceId),
	})

	if (!resource) {
		throw new Error('Resource not found')
	}

	// 2) Determine open/closed status (LOCAL weekday)
	// IMPORTANT: do NOT use "Z" here or you’ll shift the day in local time.
	const dayLocal = new Date(`${date}T00:00:00`)
	if (Number.isNaN(dayLocal.getTime())) {
		throw new Error(`Invalid date: ${date}`)
	}
	const weekday = dayLocal.getDay() // 0=Sun..6=Sat (LOCAL)

	const special = await db.query.specialHours.findFirst({
		where: eq(specialHours.date, date),
	})

	const normal = await db.query.operatingHours.findFirst({
		where: eq(operatingHours.weekday, weekday),
	})

	let status: AvailabilityResponse['status'] = 'open'
	let opensAt: string | null = normal?.opensAt ?? null
	let closesAt: string | null = normal?.closesAt ?? null

	if (special) {
		if (special.isClosed) {
			status = 'closed_by_appointment'
		} else {
			opensAt = special.opensAt ?? opensAt
			closesAt = special.closesAt ?? closesAt
		}
	} else if (normal?.isClosed) {
		status = 'closed_by_appointment'
	}

	if (!opensAt || !closesAt) {
		status = 'closed'
	}

	// 3) Build time slots
	const timeSlots: TimeSlot[] = []

	if (status === 'closed') {
		return {
			resourceId,
			date,
			status,
			defaultDurationMinutes: resource.defaultDurationMinutes,
			requiresClosedDayAck: false,
			timeSlots,
		}
	}

	assertTimeString(opensAt!)
	assertTimeString(closesAt!)

	const slotMinutes = resource.defaultDurationMinutes
	const startMinutes = toMinutes(opensAt!)
	const endMinutes = toMinutes(closesAt!)

	// If hours are invalid (e.g., closes before opens), treat as closed.
	if (endMinutes <= startMinutes || slotMinutes <= 0) {
		return {
			resourceId,
			date,
			status: 'closed',
			defaultDurationMinutes: resource.defaultDurationMinutes,
			requiresClosedDayAck: false,
			timeSlots: [],
		}
	}

	// 4) Preload all relevant reservations for that day once (NO loop queries)
	// We define a local-day window and let Postgres compare timestamptz safely.
	const dayStartIso = new Date(`${date}T00:00:00`).toISOString()
	const dayEndIso = new Date(`${date}T23:59:59`).toISOString()

	const existing = await db
		.select({
			startTime: reservations.startTime, // Date
			endTime: reservations.endTime, // Date
		})
		.from(reservations)
		.where(
			and(
				eq(reservations.resourceId, resourceId),
				inArray(reservations.status, ['pending', 'approved']),
				// IMPORTANT: right side is SQLWrapper, not raw Date param
				lt(reservations.startTime, sql`${dayEndIso}::timestamptz`),
				gt(reservations.endTime, sql`${dayStartIso}::timestamptz`)
			)
		)

	// 5) Generate slots and compute overlap counts in JS
	for (
		let minutes = startMinutes;
		minutes + slotMinutes <= endMinutes;
		minutes += slotMinutes
	) {
		const slotStart = minutesToTime(minutes)
		const slotEnd = minutesToTime(minutes + slotMinutes)

		assertTimeString(slotStart)
		assertTimeString(slotEnd)

		// LOCAL interpretation of the slot time.
		const startDateLocal = new Date(`${date}T${slotStart}:00`)
		const endDateLocal = new Date(`${date}T${slotEnd}:00`)

		const startMs = startDateLocal.getTime()
		const endMs = endDateLocal.getTime()

		// Guard against invalid parsing (rare, but worth it)
		if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
			continue
		}

		const overlapCount = existing.reduce((count, r) => {
			const rStart = r.startTime.getTime()
			const rEnd = r.endTime.getTime()

			// Overlap rule: rStart < slotEnd && rEnd > slotStart
			if (rStart < endMs && rEnd > startMs) return count + 1
			return count
		}, 0)

		const available = overlapCount < resource.maxConcurrent

		timeSlots.push({
			startTime: slotStart,
			endTime: slotEnd,
			isAvailable: available,
			reason: available ? undefined : 'Already reserved',
		})
	}

	return {
		resourceId,
		date,
		status,
		defaultDurationMinutes: resource.defaultDurationMinutes,
		requiresClosedDayAck: status === 'closed_by_appointment',
		timeSlots,
	}
}
