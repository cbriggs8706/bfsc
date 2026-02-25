// app/actions/substitute/volunteer-sub.ts
'use server'

import { db, kioskPeople } from '@/db'
import {
	shiftSubVolunteers,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function volunteerForSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const notifyRequester = await db.transaction(async (tx) => {
		const request = await tx
			.select({
				id: shiftSubRequests.id,
				status: shiftSubRequests.status,
				requestedByUserId: shiftSubRequests.requestedByUserId,
				date: shiftSubRequests.date,
				startTime: shiftSubRequests.startTime,
				endTime: shiftSubRequests.endTime,
			})
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!request || request.status !== 'open') {
			throw new Error('Request not open')
		}

		// ✅ Insert volunteer ONCE
		await tx.insert(shiftSubVolunteers).values({
			requestId,
			volunteerUserId: user.id,
		})

		await tx
			.update(shiftSubRequests)
			.set({
				status: 'awaiting_request_confirmation',
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		// Load volunteer name
		const volunteer = await tx
			.select({ fullName: kioskPeople.fullName })
			.from(kioskPeople)
			.where(eq(kioskPeople.userId, user.id))
			.then((r) => r[0])

		const volunteerName = volunteer?.fullName ?? 'A worker'

		return {
			userId: request.requestedByUserId,
			actorName: volunteerName,
			requestId: request.id,
			date: request.date,
			startTime: request.startTime,
			endTime: request.endTime,
		}
	})

	await notifySubstituteEvent(notifyRequester.userId, {
		type: 'volunteered',
		requestId: notifyRequester.requestId,
		actorName: notifyRequester.actorName,
		date: notifyRequester.date,
		startTime: notifyRequester.startTime,
		endTime: notifyRequester.endTime,
	})

	return { success: true }
}
