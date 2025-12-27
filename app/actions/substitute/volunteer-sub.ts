// app/actions/substitute/volunteer-sub.ts
'use server'

import { db, kioskPeople } from '@/db'
import {
	shiftSubVolunteers,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/db/queries/notifications'

export async function volunteerForSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db.transaction(async (tx) => {
		const request = await tx
			.select({
				id: shiftSubRequests.id,
				status: shiftSubRequests.status,
				requestedByUserId: shiftSubRequests.requestedByUserId,
				date: shiftSubRequests.date,
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

		// 🔔 Notify requester ONLY
		await notify(tx, {
			userId: request.requestedByUserId,
			type: 'sub_request_volunteered',
			message: `${volunteerName} volunteered to cover your shift on ${request.date}.`,
		})
	})

	return { success: true }
}
