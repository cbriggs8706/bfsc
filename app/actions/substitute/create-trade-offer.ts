// app/actions/substitute/create-trade-offer.ts
'use server'

import { db } from '@/db'
import {
	shiftTradeOffers,
	shiftTradeOfferOptions,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

type TradeOptionInput = {
	shiftId: string
	shiftRecurrenceId: string
	date: string
	startTime: string
	endTime: string
}

export async function createTradeOffer(
	requestId: string,
	message: string | undefined,
	options: TradeOptionInput[]
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const req = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!req || req.type !== 'trade') {
		throw new Error('Invalid trade request')
	}

	await db.transaction(async (tx) => {
		const [offer] = await tx
			.insert(shiftTradeOffers)
			.values({
				requestId,
				offeredByUserId: user.id,
				message,
			})
			.returning()

		await tx.insert(shiftTradeOfferOptions).values(
			options.map((o) => ({
				offerId: offer.id,
				shiftId: o.shiftId,
				shiftRecurrenceId: o.shiftRecurrenceId,
				date: o.date,
				startTime: o.startTime,
				endTime: o.endTime,
			}))
		)
	})

	return { success: true }
}
