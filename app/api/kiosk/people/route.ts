// app/api/kiosk/people/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople, kioskPersonPositions } from '@/db/schema/tables/kiosk'
import { positions } from '@/db/schema/tables/faith'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'
import { isConsultantRole } from '@/lib/is-consultant-role'

function generatePasscode() {
	return Math.floor(100000 + Math.random() * 900000).toString()
}

async function generateUniquePasscode() {
	while (true) {
		const code = generatePasscode()
		const existing = await db.query.kioskPeople.findFirst({
			where: eq(kioskPeople.passcode, code),
		})
		if (!existing) return code
	}
}

export async function POST(req: Request) {
	const {
		fullName,
		email,
		phone,
		faithId,
		wardId,
		position,
		notes,
		userId,
		wantsPasscode = false,
	} = (await req.json()) as {
		fullName: string
		email?: string | null
		phone?: string | null
		faithId?: string | null
		wardId?: string | null
		position?: string | null
		notes?: string | null
		userId?: string | null
		wantsPasscode?: boolean
	}

	// ──────────────────────────────
	// PASSCODE
	// ──────────────────────────────
	let passcode: string | null = null

	if (wantsPasscode) {
		passcode = await generateUniquePasscode()
	}

	// ──────────────────────────────
	// CONSULTANT CACHE
	// ──────────────────────────────
	let isConsultantCached = false
	if (userId) {
		const u = await db.query.user.findFirst({
			where: eq(user.id, userId),
		})
		if (u) {
			isConsultantCached = isConsultantRole(u.role)
		}
	}

	// ──────────────────────────────
	// CREATE PERSON
	// ──────────────────────────────
	const [person] = await db
		.insert(kioskPeople)
		.values({
			fullName,
			email: email ?? null,
			phone: phone ?? null,
			faithId: faithId ?? null,
			wardId: wardId ?? null,
			notes: notes ?? null,
			userId: userId ?? null,
			passcode,
			isConsultantCached,
		})
		.returning()

	// ──────────────────────────────
	// OPTIONAL POSITION ASSIGNMENT
	// ──────────────────────────────
	if (position) {
		let pos = await db.query.positions.findFirst({
			where: eq(positions.name, position),
		})

		if (!pos) {
			;[pos] = await db.insert(positions).values({ name: position }).returning()
		}

		await db.insert(kioskPersonPositions).values({
			personId: person.id,
			positionId: pos.id,
			sustainedAt: new Date(),
		})
	}

	// ──────────────────────────────
	// RESPONSE
	// ──────────────────────────────
	return NextResponse.json({
		person: {
			id: person.id,
			fullName: person.fullName,
			userId: person.userId,
			hasPasscode: !!person.passcode,
			isConsultant: person.isConsultantCached,
		},
		passcode,
	})
}
