// app/actions/substitute/set-availability.ts
'use server'

import { db } from '@/db'
import { consultantShiftAvailability } from '@/db/schema/tables/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import type { AvailabilityLevel } from '@/db/schema/tables/substitutes'

type SetAvailabilityInput = {
	shiftId: string
	shiftRecurrenceId?: string
	level: AvailabilityLevel
}

export async function setAvailability(input: SetAvailabilityInput) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db
		.insert(consultantShiftAvailability)
		.values({
			userId: user.id,
			shiftId: input.shiftId,
			shiftRecurrenceId: input.shiftRecurrenceId ?? null,
			level: input.level,
		})
		.onConflictDoUpdate({
			target: [
				consultantShiftAvailability.userId,
				consultantShiftAvailability.shiftId,
				consultantShiftAvailability.shiftRecurrenceId,
			],
			set: {
				level: input.level,
				updatedAt: new Date(),
			},
		})

	return { success: true }
}
