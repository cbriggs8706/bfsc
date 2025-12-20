// app/actions/substitute/accept-volunteer.ts
'use server'

import { db, notifications } from '@/db'
import {
	shiftSubRequests,
	shiftSubVolunteers,
} from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { NotificationType } from '@/types/substitutes'

export async function acceptVolunteer(
	requestId: string,
	volunteerUserId: string
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		const request = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!request) throw new Error('Request not found')

		if (request.requestedByUserId !== user.id) {
			throw new Error('Forbidden')
		}

		// Ensure volunteer exists and is active
		const volunteer = await tx
			.select()
			.from(shiftSubVolunteers)
			.where(
				and(
					eq(shiftSubVolunteers.requestId, requestId),
					eq(shiftSubVolunteers.volunteerUserId, volunteerUserId),
					eq(shiftSubVolunteers.status, 'offered')
				)
			)
			.then((r) => r[0])

		if (!volunteer) throw new Error('Volunteer not available')

		// Accept the request
		await tx
			.update(shiftSubRequests)
			.set({
				status: 'accepted',
				acceptedByUserId: volunteerUserId,
				acceptedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		// Notify volunteer
		await tx.insert(notifications).values({
			userId: volunteerUserId,
			type: 'sub_request_accepted' satisfies NotificationType,
			message: 'Your volunteer offer was accepted.',
		})
	})

	return { success: true }
}
