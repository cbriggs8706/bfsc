// app/actions/substitute/clear-availability.ts
'use server'

import { db } from '@/db'
import { consultantShiftAvailability } from '@/db/schema/tables/substitutes'
import { eq, and, isNull } from 'drizzle-orm'

export async function clearAvailability(input: {
	shiftId: string
	shiftRecurrenceId?: string
}) {
	await db
		.delete(consultantShiftAvailability)
		.where(
			and(
				eq(consultantShiftAvailability.shiftId, input.shiftId),
				input.shiftRecurrenceId
					? eq(
							consultantShiftAvailability.shiftRecurrenceId,
							input.shiftRecurrenceId
					  )
					: isNull(consultantShiftAvailability.shiftRecurrenceId)
			)
		)
}
