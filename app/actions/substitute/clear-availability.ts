// app/actions/substitute/clear-availability.ts
'use server'

import { db } from '@/db'
import { workerShiftAvailability } from '@/db/schema/tables/substitutes'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function clearAvailability(input: {
	shiftId: string
	shiftRecurrenceId?: string
}) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db
		.delete(workerShiftAvailability)
		.where(
			and(
				eq(workerShiftAvailability.userId, user.id),
				eq(workerShiftAvailability.shiftId, input.shiftId),
				input.shiftRecurrenceId
					? eq(
							workerShiftAvailability.shiftRecurrenceId,
							input.shiftRecurrenceId
					  )
					: isNull(workerShiftAvailability.shiftRecurrenceId)
			)
		)
}
