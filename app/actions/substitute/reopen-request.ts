// app/actions/substitute/reopen-request.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { canReopenSubRequest } from '@/lib/substitutes/pipeline'

export async function reopenSubRequest(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		const [request] = await tx
			.select({
				requestedByUserId: shiftSubRequests.requestedByUserId,
				status: shiftSubRequests.status,
			})
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.for('update')

		if (!request) {
			throw new Error('Request not found')
		}

		// 🔒 Only the requester can reopen
		if (request.requestedByUserId !== user.id) {
			throw new Error('Forbidden')
		}

		// 🔒 Only terminal states can be reopened
		if (!canReopenSubRequest(request.status)) {
			throw new Error('Request cannot be reopened')
		}

		await tx
			.update(shiftSubRequests)
			.set({
				status: 'open',
				hasNominatedSub: false,
				nominatedSubUserId: null,
				nominatedConfirmedAt: null,
				acceptedByUserId: null,
				acceptedAt: null,
			})
			.where(eq(shiftSubRequests.id, requestId))
	})

	return { success: true }
}
