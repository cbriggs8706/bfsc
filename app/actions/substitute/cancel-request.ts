// app/actions/substitute/cancel-request.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function cancelSubRequest(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const req = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!req || req.requestedByUserId !== user.id) {
		throw new Error('Forbidden')
	}

	if (req.status === 'accepted') {
		throw new Error('Cannot cancel an accepted request')
	}

	await db
		.update(shiftSubRequests)
		.set({ status: 'cancelled' })
		.where(eq(shiftSubRequests.id, requestId))

	return { success: true }
}
