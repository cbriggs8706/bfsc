// app/actions/substitute/confirm-nominated-sub.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { shiftExceptions } from '@/db/schema/tables/shifts'
import { getCurrentUser } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'
import { notifySubstituteEvent } from '@/lib/substitutes/notifications'

export async function confirmNominatedSub(requestId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const accepted = await db.transaction(async (tx) => {
		const req = await tx
			.select()
			.from(shiftSubRequests)
			.where(eq(shiftSubRequests.id, requestId))
			.then((r) => r[0])

		if (!req) throw new Error('Request not found')

		if (req.status !== 'awaiting_nomination_confirmation') {
			throw new Error('Invalid request state')
		}

		if (req.nominatedSubUserId !== user.id) {
			throw new Error('Forbidden')
		}

		// ✅ ACCEPT DIRECTLY
		await tx
			.update(shiftSubRequests)
			.set({
				status: 'accepted',
				acceptedByUserId: user.id,
				acceptedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))

		await tx
			.delete(shiftExceptions)
			.where(
				and(
					eq(shiftExceptions.shiftId, req.shiftId),
					eq(shiftExceptions.date, req.date),
					eq(shiftExceptions.overrideType, 'replace'),
					eq(shiftExceptions.status, 'auto-approved'),
					eq(shiftExceptions.requestedBy, req.requestedByUserId)
				)
			)

		await tx.insert(shiftExceptions).values({
			shiftId: req.shiftId,
			date: req.date,
			overrideType: 'replace',
			userId: user.id,
			requestedBy: req.requestedByUserId,
			approvedBy: user.id,
			status: 'auto-approved',
			notes: `Auto-applied from nominated substitute request ${req.id}`,
		})

		return {
			requesterUserId: req.requestedByUserId,
			requestId: req.id,
			date: req.date,
			startTime: req.startTime,
			endTime: req.endTime,
		}
	})

	await notifySubstituteEvent(accepted.requesterUserId, {
		type: 'accepted',
		requestId: accepted.requestId,
		date: accepted.date,
		startTime: accepted.startTime,
		endTime: accepted.endTime,
	})

	return { success: true }
}
