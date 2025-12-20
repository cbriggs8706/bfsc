// app/actions/substitute/withdraw-volunteer.ts
'use server'

import { db } from '@/db'
import {
	shiftSubVolunteers,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { eq, and, sql } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function withdrawVolunteer(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		// 🔒 Lock the request and verify state
		const [request] = await tx
			.select({
				status: shiftSubRequests.status,
			})
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.for('update')

		if (!request) {
			throw new Error('Request not found')
		}

		if (request.status !== 'awaiting_request_confirmation') {
			throw new Error('Cannot withdraw from this request state')
		}

		// 1️⃣ Withdraw THIS volunteer
		await tx
			.update(shiftSubVolunteers)
			.set({ status: 'withdrawn' })
			.where(
				and(
					eq(shiftSubVolunteers.requestId, requestId),
					eq(shiftSubVolunteers.volunteerUserId, user.id),
					eq(shiftSubVolunteers.status, 'offered')
				)
			)

		// 2️⃣ Check if any offered volunteers remain
		const [{ count }] = await tx
			.select({ count: sql<number>`count(*)` })
			.from(shiftSubVolunteers)
			.where(
				and(
					eq(shiftSubVolunteers.requestId, requestId),
					eq(shiftSubVolunteers.status, 'offered')
				)
			)

		// 3️⃣ If none remain, reopen request
		if (Number(count) === 0) {
			await tx
				.update(shiftSubRequests)
				.set({
					status: 'open',
					hasNominatedSub: false,
					nominatedSubUserId: null,
				})
				.where(eq(shiftSubRequests.id, requestId))
		}
	})

	return { success: true }
}
