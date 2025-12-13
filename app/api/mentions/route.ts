// app/api/mentions/route.ts
import { NextResponse } from 'next/server'
import { db, kioskPeople } from '@/db'
import { user } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET() {
	const kiosk = await db
		.select({
			id: kioskPeople.userId,
			label: kioskPeople.fullName,
			image: kioskPeople.profileImageUrl,
		})
		.from(kioskPeople)
		.where(eq(kioskPeople.isConsultantCached, true))

	const fallbackUsers = await db
		.select({
			id: user.id,
			label: user.name,
			image: user.image,
		})
		.from(user)

	const merged = new Map<string, any>()

	for (const k of kiosk) {
		if (!k.id) continue
		merged.set(k.id, {
			id: k.id,
			label: k.label,
			value: k.label.replace(/\s+/g, ''),
			image: k.image,
		})
	}

	for (const u of fallbackUsers) {
		if (!merged.has(u.id)) {
			merged.set(u.id, {
				id: u.id,
				label: u.label ?? 'User',
				value: (u.label ?? 'user').replace(/\s+/g, ''),
				image: u.image,
			})
		}
	}

	return NextResponse.json([...merged.values()])
}
