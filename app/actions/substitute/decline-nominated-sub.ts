// app/actions/substitute/decline-nominated-sub.ts
'use server'

import { db, kioskPeople } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function declineNominatedSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const requesterNotification = await db.transaction(async (tx) => {
		const request = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!request) throw new Error('Request not found')

		if (
			request.status !== 'awaiting_nomination_confirmation' ||
			request.nominatedSubUserId !== user.id
		) {
			throw new Error('Forbidden')
		}

		/* -----------------------------
		 * Load worker name
		 * --------------------------- */
		const worker = await tx
			.select({ fullName: kioskPeople.fullName })
			.from(kioskPeople)
			.where(eq(kioskPeople.userId, user.id))
			.then((r) => r[0])

		const workerName = worker?.fullName ?? 'The worker'

		/* -----------------------------
		 * Re-open request
		 * --------------------------- */
		await tx
			.update(shiftSubRequests)
			.set({
				status: 'open',
				hasNominatedSub: false,
				nominatedSubUserId: null,
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))
		return {
			userId: request.requestedByUserId,
			actorName: workerName,
			requestId: request.id,
			date: request.date,
			startTime: request.startTime,
			endTime: request.endTime,
		}
	})

	await notifySubstituteEvent(requesterNotification.userId, {
		type: 'declined',
		requestId: requesterNotification.requestId,
		actorName: requesterNotification.actorName,
		date: requesterNotification.date,
		startTime: requesterNotification.startTime,
		endTime: requesterNotification.endTime,
	})
}
