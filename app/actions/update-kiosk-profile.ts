'use server'

import { db } from '@/db'
import { kioskPeople } from '@/db'
import { eq } from 'drizzle-orm'

interface UpdateKioskProfileInput {
	kioskPersonId: string
	fullName?: string
	email?: string | null
	profileImageUrl?: string | null
}

export async function updateKioskProfile(
	input: UpdateKioskProfileInput
): Promise<void> {
	await db
		.update(kioskPeople)
		.set({
			...(input.fullName !== undefined && { fullName: input.fullName }),
			...(input.email !== undefined && { email: input.email }),
			...(input.profileImageUrl !== undefined && {
				profileImageUrl: input.profileImageUrl,
			}),
			updatedAt: new Date(),
		})
		.where(eq(kioskPeople.id, input.kioskPersonId))
}
