// app/actions/substitute/nominate-substitute.ts
'use server'

import { db, user as userTable } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function nominateSubstitute(
	requestId: string,
	workerUserId: string
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const assignedShift = await db.transaction(async (tx) => {
		const request = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!request) throw new Error('Request not found')

		if (request.requestedByUserId !== user.id) {
			throw new Error('Forbidden')
		}

		if (request.status !== 'open') {
			throw new Error('Request is not open')
		}

		const workerAuthUser = await tx
			.select({ id: userTable.id })
			.from(userTable)
			.where(eq(userTable.id, workerUserId))
			.then((r) => r[0])

		if (!workerAuthUser) {
			throw new Error('Invalid workerUserId (must be auth user id)')
		}

		await tx
			.update(shiftSubRequests)
			.set({
				hasNominatedSub: true,
				nominatedSubUserId: workerUserId,
				status: 'awaiting_nomination_confirmation',
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		return {
			requestId: request.id,
			date: request.date,
			startTime: request.startTime,
			endTime: request.endTime,
		}
	})

	await notifySubstituteEvent(workerUserId, {
		type: 'assignment',
		requestId: assignedShift.requestId,
		date: assignedShift.date,
		startTime: assignedShift.startTime,
		endTime: assignedShift.endTime,
	})
}
