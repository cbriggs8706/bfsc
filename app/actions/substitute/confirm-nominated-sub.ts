// app/actions/substitute/confirm-nominated-sub.ts
'use server'

import { db, notifications } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { NotificationType } from '@/types/substitutes'

export async function confirmNominatedSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		const req = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!req) throw new Error('Request not found')

		if (req.status !== 'awaiting_nomination_confirmation') {
			throw new Error('Invalid request state')
		}

		if (req.nominatedSubUserId !== user.id) {
			throw new Error('Forbidden')
		}

		// ✅ ACCEPT DIRECTLY
		await tx
			.update(shiftSubRequests)
			.set({
				status: 'accepted',
				acceptedByUserId: user.id,
				acceptedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		// 🔔 Notify requester
		await tx.insert(notifications).values({
			userId: req.requestedByUserId,
			type: 'sub_request_accepted' satisfies NotificationType,
			message: `Your substitute request for ${req.date} has been accepted.`,
		})
	})

	return { success: true }
}
