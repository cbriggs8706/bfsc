// app/actions/substitute/nominate-substitute.ts
'use server'

import { db, notifications, user as userTable } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { NotificationType } from '@/types/substitutes'

export async function nominateSubstitute(
	requestId: string,
	workerUserId: string
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

		await tx.insert(notifications).values({
			userId: workerUserId,
			type: 'sub_request_assignment' satisfies NotificationType,
			message: `You have been requested to cover a shift on ${request.date}.`,
		})
	})
}
