// app/actions/substitute/accept-volunteer.ts
'use server'

import { db } from '@/db'
import {
	shiftSubRequests,
	shiftSubVolunteers,
} from '@/db/schema/tables/substitutes'
import { shiftExceptions } from '@/db/schema/tables/shifts'
import { getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function acceptVolunteer(
	requestId: string,
	volunteerUserId: string
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const acceptedShift = await db.transaction(async (tx) => {
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
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		// Ensure this date reflects the accepted substitute assignment.
		await tx
			.delete(shiftExceptions)
			.where(
				and(
					eq(shiftExceptions.shiftId, request.shiftId),
					eq(shiftExceptions.date, request.date),
					eq(shiftExceptions.overrideType, 'replace'),
					eq(shiftExceptions.status, 'auto-approved'),
					eq(shiftExceptions.requestedBy, request.requestedByUserId)
				)
			)

		await tx.insert(shiftExceptions).values({
			shiftId: request.shiftId,
			date: request.date,
			overrideType: 'replace',
			userId: volunteerUserId,
			requestedBy: request.requestedByUserId,
			approvedBy: user.id,
			status: 'auto-approved',
			notes: `Auto-applied from accepted substitute request ${request.id}`,
		})

		return {
			requestId: request.id,
			date: request.date,
			startTime: request.startTime,
			endTime: request.endTime,
		}
	})

	await notifySubstituteEvent(volunteerUserId, {
		type: 'accepted',
		requestId: acceptedShift.requestId,
		date: acceptedShift.date,
		startTime: acceptedShift.startTime,
		endTime: acceptedShift.endTime,
	})

	return { success: true }
}
