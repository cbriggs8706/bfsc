// app/actions/substitute/cancel-nomination.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function cancelNomination(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const req = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!req || req.requestedByUserId !== user.id) {
		throw new Error('Forbidden')
	}

	if (req.status !== 'awaiting_nomination_confirmation') {
		throw new Error('No active nomination to cancel')
	}

	await db
		.update(shiftSubRequests)
		.set({
			status: 'open',
			nominatedSubUserId: null,
		})
		.where(eq(shiftSubRequests.id, requestId))

	return { success: true }
}
