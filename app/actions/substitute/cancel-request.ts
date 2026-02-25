// app/actions/substitute/cancel-request.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { canCancelSubRequest } from '@/lib/substitutes/pipeline'

export async function cancelSubRequest(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const req = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!req || req.requestedByUserId !== user.id) {
		throw new Error('Forbidden')
	}

	if (!canCancelSubRequest(req.status)) {
		throw new Error('Cannot cancel request in its current state')
	}

	await db
		.update(shiftSubRequests)
		.set({ status: 'cancelled' })
		.where(eq(shiftSubRequests.id, requestId))

	return { success: true }
}
