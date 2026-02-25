// app/actions/substitute/expire-requests.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { lt, and, inArray } from 'drizzle-orm'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function expireOldSubRequests(today: string) {
	const expired = await db
		.update(shiftSubRequests)
		.set({
			status: 'expired',
			updatedAt: new Date(),
		})
		.where(
			and(
				lt(shiftSubRequests.date, today),
				inArray(shiftSubRequests.status, [
					'open',
					'awaiting_nomination_confirmation',
				])
			)
		)
		.returning()

	for (const req of expired) {
		await notifySubstituteEvent(req.requestedByUserId, {
			type: 'expired',
			requestId: req.id,
			date: req.date,
			startTime: req.startTime,
			endTime: req.endTime,
		})
	}
}
