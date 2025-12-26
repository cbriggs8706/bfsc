// lib/reservations/validate-reservation.ts
import { db } from '@/db'
import { reservations } from '@/db'
import { and, eq, gt, inArray, lt, sql } from 'drizzle-orm'

type Params = {
	resourceId: string
	startTime: Date
	endTime: Date
	isClosedDayRequest: boolean
}

export async function validateReservationRequest(params: Params): Promise<{
	ok: boolean
	reason?: string
}> {
	const { resourceId, startTime, endTime, isClosedDayRequest } = params

	if (endTime <= startTime) {
		return { ok: false, reason: 'Invalid time range' }
	}

	// Convert to ISO ONCE
	const startIso = startTime.toISOString()
	const endIso = endTime.toISOString()

	// Check overlapping reservations
	const overlap = await db
		.select({ id: reservations.id })
		.from(reservations)
		.where(
			and(
				eq(reservations.resourceId, resourceId),
				inArray(reservations.status, ['pending', 'approved']),
				lt(reservations.startTime, sql`${endIso}::timestamptz`),
				gt(reservations.endTime, sql`${startIso}::timestamptz`)
			)
		)

	if (overlap.length > 0) {
		return { ok: false, reason: 'Time slot already reserved' }
	}

	// Closed-day acknowledgement logic
	if (!isClosedDayRequest) {
		// You can plug in stricter closed-day checks here later
	}

	return { ok: true }
}
