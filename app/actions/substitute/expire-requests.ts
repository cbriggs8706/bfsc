// app/actions/substitute/expire-requests.ts
'use server'

import { db, notifications } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { lt, and, inArray } from 'drizzle-orm'
import { NotificationType } from '@/types/substitutes'

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
		await db.insert(notifications).values({
			userId: req.requestedByUserId,
			type: 'sub_request_expired' satisfies NotificationType,
			message: `Your substitute request for ${req.date} has expired.`,
		})
	}
}
