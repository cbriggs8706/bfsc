// app/actions/substitute/withdraw-accepted-sub.ts
'use server'

import { db, kioskPeople, notifications } from '@/db'
import {
	shiftAssignmentExceptions,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { and, eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function withdrawAcceptedSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		const request = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!request) throw new Error('Request not found')

		if (request.status !== 'accepted' || request.acceptedByUserId !== user.id) {
			throw new Error('Forbidden')
		}

		/* -----------------------------
		 * Load consultant name
		 * --------------------------- */
		const consultant = await tx
			.select({ fullName: kioskPeople.fullName })
			.from(kioskPeople)
			.where(eq(kioskPeople.userId, user.id))
			.then((r) => r[0])

		const consultantName = consultant?.fullName ?? 'The consultant'

		/* -----------------------------
		 * Remove assignment exception
		 * --------------------------- */
		await tx
			.delete(shiftAssignmentExceptions)
			.where(
				and(
					eq(shiftAssignmentExceptions.shiftId, request.shiftId),
					eq(shiftAssignmentExceptions.date, request.date),
					eq(shiftAssignmentExceptions.assignedUserId, user.id)
				)
			)

		/* -----------------------------
		 * Re-open request
		 * --------------------------- */
		await tx
			.update(shiftSubRequests)
			.set({
				status: 'open',
				acceptedByUserId: null,
				acceptedAt: null,
			})
			.where(eq(shiftSubRequests.id, requestId))

		/* -----------------------------
		 * Notify requester
		 * --------------------------- */
		await tx.insert(notifications).values({
			userId: request.requestedByUserId,
			type: 'sub_request_reopened',
			message: `${consultantName} has withdrawn from covering the shift. The request is open again.`,
		})
	})
}
