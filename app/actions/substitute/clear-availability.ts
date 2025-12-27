// app/actions/substitute/clear-availability.ts
'use server'

import { db } from '@/db'
import { workerShiftAvailability } from '@/db/schema/tables/substitutes'
import { eq, and, isNull } from 'drizzle-orm'

export async function clearAvailability(input: {
	shiftId: string
	shiftRecurrenceId?: string
}) {
	await db
		.delete(workerShiftAvailability)
		.where(
			and(
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
