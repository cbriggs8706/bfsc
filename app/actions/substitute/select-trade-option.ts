// app/actions/substitute/select-trade-option.ts
'use server'

import { db } from '@/db'
import {
	shiftSubRequests,
	shiftTradeOffers,
	shiftTradeOfferOptions,
	shiftExceptions,
} from '@/db'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function selectTradeOption(
	requestId: string,
	offerId: string,
	optionId: string
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const req = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!req || req.requestedByUserId !== user.id) {
		throw new Error('Forbidden')
	}

	const offer = await db.query.shiftTradeOffers.findFirst({
		where: eq(shiftTradeOffers.id, offerId),
	})

	const option = await db.query.shiftTradeOfferOptions.findFirst({
		where: eq(shiftTradeOfferOptions.id, optionId),
	})

	if (!offer || !option) throw new Error('Invalid trade option')

	await db.transaction(async (tx) => {
		// Swap requested shift
		await tx.insert(shiftExceptions).values({
			shiftId: req.shiftId,
			date: req.date,
			overrideType: 'replace',
			userId: offer.offeredByUserId,
			requestedBy: user.id,
			approvedBy: offer.offeredByUserId,
			status: 'auto-approved',
		})

		// Swap offered shift
		await tx.insert(shiftExceptions).values({
			shiftId: option.shiftId,
			date: option.date,
			overrideType: 'replace',
			userId: user.id,
			requestedBy: offer.offeredByUserId,
			approvedBy: user.id,
			status: 'auto-approved',
		})

		await tx
			.update(shiftTradeOfferOptions)
			.set({ status: 'selected' })
			.where(eq(shiftTradeOfferOptions.id, optionId))

		await tx
			.update(shiftSubRequests)
			.set({
				status: 'accepted',
				acceptedByUserId: offer.offeredByUserId,
				acceptedAt: new Date(),
			})
			.where(eq(shiftSubRequests.id, requestId))
	})

	return { success: true }
}
