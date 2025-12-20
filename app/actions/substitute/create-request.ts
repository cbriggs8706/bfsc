// app/actions/substitute/create-request.ts
'use server'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import type { SubRequestType } from '@/db/schema/tables/substitutes'

type CreateSubRequestInput = {
	shiftId: string
	shiftRecurrenceId: string
	date: string // YYYY-MM-DD
	startTime: string
	endTime: string
	type: SubRequestType
	notes?: string
	nominatedSubUserId?: string
}

export async function createSubRequest(input: CreateSubRequestInput) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const hasNominated = Boolean(input.nominatedSubUserId)

	await db.insert(shiftSubRequests).values({
		shiftId: input.shiftId,
		shiftRecurrenceId: input.shiftRecurrenceId,
		date: input.date,
		startTime: input.startTime,
		endTime: input.endTime,
		type: input.type,
		status: hasNominated ? 'awaiting_nomination_confirmation' : 'open',
		requestedByUserId: user.id,
		notes: input.notes,
		hasNominatedSub: hasNominated,
		nominatedSubUserId: input.nominatedSubUserId ?? null,
	})

	return { success: true }
}
