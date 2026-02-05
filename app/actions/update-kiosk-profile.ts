'use server'

import { db } from '@/db'
import { kioskPeople } from '@/db'
import { getCenterProfile } from '@/lib/actions/center/center'
import { normalizePhoneToE164 } from '@/utils/phone'
import { eq } from 'drizzle-orm'

interface UpdateKioskProfileInput {
	kioskPersonId: string

	// kiosk_people fields
	fullName?: string
	email?: string | null
	phone?: string | null
	passcode?: string | null
	profileImageUrl?: string | null
	languagesSpoken?: string[]
	researchSpecialties?: string[]
	pid?: string
	faithId?: string | null
	wardId?: string | null
}

export async function updateKioskProfile(
	input: UpdateKioskProfileInput
): Promise<void> {
	const center = await getCenterProfile()

	const normalizedPhone =
		input.phone !== undefined && input.phone !== null
			? normalizePhoneToE164(input.phone, center.phoneCountry)
			: undefined

	await db
		.update(kioskPeople)
		.set({
			...(input.fullName !== undefined && { fullName: input.fullName }),
			...(input.email !== undefined && { email: input.email }),
			...(input.phone !== undefined && { phone: input.phone }),
			...(input.passcode !== undefined && {
				passcode: input.passcode || null,
			}),
			...(input.profileImageUrl !== undefined && {
				profileImageUrl: input.profileImageUrl,
			}),
			...(input.languagesSpoken !== undefined && {
				languagesSpoken: input.languagesSpoken,
			}),
			...(input.researchSpecialties !== undefined && {
				researchSpecialties: input.researchSpecialties,
			}),
			...(normalizedPhone !== undefined && { phone: normalizedPhone }),
			...(input.pid !== undefined && { pid: input.pid }),
			...(input.faithId !== undefined && { faithId: input.faithId }),
			...(input.wardId !== undefined && { wardId: input.wardId }),

			updatedAt: new Date(),
		})
		.where(eq(kioskPeople.id, input.kioskPersonId))
}
