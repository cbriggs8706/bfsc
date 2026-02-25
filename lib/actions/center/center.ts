'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

// ✅ Adjust these two imports to match your project
import { db } from '@/db'
import { center } from '@/db/schema/tables/shifts'
import { type CountryCode } from 'libphonenumber-js'
import { toCountryCode } from '@/utils/phone'

type CenterProfile = {
	name: string
	abbreviation: string
	address: string
	city: string
	state: string
	zipcode: string
	phoneNumber: string
	phoneCountry: CountryCode
	primaryLanguage: string
	heroImageUrl: string | null
	established: number | null
}

const DEFAULT_CENTER: CenterProfile = {
	name: '',
	abbreviation: '',
	address: '',
	city: '',
	state: '',
	zipcode: '',
	phoneNumber: '',
	phoneCountry: 'US',
	primaryLanguage: 'en',
	heroImageUrl: null,
	established: null,
}

export async function getCenterProfile(): Promise<CenterProfile> {
	const row = await db.query.center.findFirst({
		where: eq(center.id, 1),
	})

	if (!row) return DEFAULT_CENTER

	return {
		name: row.name ?? '',
		abbreviation: row.abbreviation ?? '',
		address: row.address ?? '',
		city: row.city ?? '',
		state: row.state ?? '',
		zipcode: row.zipcode ?? '',
		phoneNumber: row.phoneNumber ?? '',
		phoneCountry: toCountryCode(row.phoneCountry, 'US'),
		primaryLanguage: row.primaryLanguage ?? 'en',
		heroImageUrl: row.heroImageUrl ?? null,
		established: row.established ?? null,
	}
}

export async function upsertCenterProfile(input: CenterProfile) {
	try {
		// singleton row => id = 1
		await db
			.insert(center)
			.values({
				id: 1,
				...input,
				abbreviation: input.abbreviation.toUpperCase().slice(0, 4),
				state: input.state.toUpperCase().slice(0, 2),
				primaryLanguage: input.primaryLanguage || 'en',
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: center.id,
				set: {
					...input,
					abbreviation: input.abbreviation.toUpperCase().slice(0, 4),
					state: input.state.toUpperCase().slice(0, 2),
					primaryLanguage: input.primaryLanguage || 'en',
					updatedAt: new Date(),
				},
			})

		// revalidate your admin page (and anything else that reads center)
		revalidatePath('/admin/center')
		revalidatePath('/', 'layout')

		return { ok: true as const }
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Database error'
		console.error('upsertCenterProfile error', err)
		return { ok: false as const, message }
	}
}
