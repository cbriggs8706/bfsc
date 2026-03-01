// app/api/kiosk/people/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople, kioskPersonCallings } from '@/db/schema/tables/kiosk'
import { callings } from '@/db/schema/tables/faith'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'
import { isWorkerRole } from '@/lib/is-worker-role'
import { normalizeFullNameForStorage } from '@/lib/names'

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
		calling,
		notes,
		userId,
		wantsPasscode = false,
	} = (await req.json()) as {
		fullName: string
		email?: string | null
		phone?: string | null
		faithId?: string | null
		wardId?: string | null
		calling?: string | null
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
	// WORKER CACHE
	// ──────────────────────────────
	let isWorkerCached = false
	if (userId) {
		const u = await db.query.user.findFirst({
			where: eq(user.id, userId),
		})
		if (u) {
			isWorkerCached = isWorkerRole(u.role)
		}
	}

	// ──────────────────────────────
	// CREATE PERSON
	// ──────────────────────────────
	const normalizedFullName = normalizeFullNameForStorage(fullName)

	const [person] = await db
		.insert(kioskPeople)
		.values({
			fullName: normalizedFullName,
			email: email ?? null,
			phone: phone ?? null,
			faithId: faithId ?? null,
			wardId: wardId ?? null,
			notes: notes ?? null,
			userId: userId ?? null,
			passcode,
			isWorkerCached,
		})
		.returning()

	// ──────────────────────────────
	// OPTIONAL POSITION ASSIGNMENT
	// ──────────────────────────────
	if (calling) {
		let pos = await db.query.callings.findFirst({
			where: eq(callings.name, calling),
		})

		if (!pos) {
			;[pos] = await db.insert(callings).values({ name: calling }).returning()
		}

		await db.insert(kioskPersonCallings).values({
			personId: person.id,
			callingId: pos.id,
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
			isWorker: person.isWorkerCached,
		},
		passcode,
	})
}
