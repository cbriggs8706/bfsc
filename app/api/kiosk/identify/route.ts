// app/api/kiosk/identify/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople, KioskPeopleInsert } from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { eq, ilike } from 'drizzle-orm'

const CONSULTANT_ROLES = [
	'Consultant',
	'Shift Lead',
	'Assistant Director',
	'Director',
	'High Councilman',
	'Admin',
]

function isConsultantRole(role: string | null): boolean {
	return role !== null && CONSULTANT_ROLES.includes(role)
}

type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isConsultant: boolean
	hasPasscode: boolean
}

type IdentifyNotFound = {
	status: 'notFound'
	suggestedName: string | null
}

type IdentifyFoundSingle = {
	status: 'foundSingle'
	person: PersonSummary
}

type IdentifyMultiple = {
	status: 'multipleMatches'
	people: PersonSummary[]
}

export type IdentifyResponse =
	| IdentifyNotFound
	| IdentifyFoundSingle
	| IdentifyMultiple

type IdentifyRequestById = {
	id: string
	input?: undefined
}

type IdentifyRequestByInput = {
	input: string
	id?: undefined
}

type IdentifyRequest = IdentifyRequestById | IdentifyRequestByInput

async function createKioskPersonFromUserRow(u: {
	id: string
	name: string | null
	email: string | null
	role: string | null
}): Promise<PersonSummary | null> {
	if (!u.name) return null

	const isConsultant = isConsultantRole(u.role)

	const insert: KioskPeopleInsert = {
		fullName: u.name,
		email: u.email,
		userId: u.id,
		isConsultantCached: isConsultant,
	}

	const [created] = await db.insert(kioskPeople).values(insert).returning()

	return {
		id: created.id,
		fullName: created.fullName,
		userId: created.userId,
		isConsultant,
		hasPasscode: Boolean(created.passcode),
	}
}

export async function POST(req: Request) {
	const body: IdentifyRequest = await req.json()

	// ─────────────────────────────
	// MODE A: identify by explicit id (from selection)
	// ─────────────────────────────
	if ('id' in body && body.id) {
		const rawId = body.id

		// 1) Selected from USER table (id prefixed with "user:")
		if (rawId.startsWith('user:')) {
			const userId = rawId.slice('user:'.length)

			const existingUser = await db.query.user.findFirst({
				where: eq(user.id, userId),
			})

			if (!existingUser || !existingUser.name) {
				return NextResponse.json<IdentifyResponse>({
					status: 'notFound',
					suggestedName: null,
				})
			}

			// Check if they already have a kiosk_people record
			const existingKiosk = await db.query.kioskPeople.findFirst({
				where: eq(kioskPeople.userId, existingUser.id),
			})

			const isConsultant = isConsultantRole(existingUser.role)

			if (existingKiosk) {
				const person: PersonSummary = {
					id: existingKiosk.id,
					fullName: existingKiosk.fullName,
					userId: existingKiosk.userId,
					isConsultant,
					hasPasscode: Boolean(existingKiosk.passcode),
				}

				return NextResponse.json<IdentifyResponse>({
					status: 'foundSingle',
					person,
				})
			}

			// No kiosk_people entry yet: create one
			const insert: KioskPeopleInsert = {
				fullName: existingUser.name,
				email: existingUser.email,
				userId: existingUser.id,
				isConsultantCached: isConsultant,
			}

			const [created] = await db.insert(kioskPeople).values(insert).returning()

			const person: PersonSummary = {
				id: created.id,
				fullName: created.fullName,
				userId: created.userId,
				isConsultant,
				hasPasscode: Boolean(created.passcode),
			}

			return NextResponse.json<IdentifyResponse>({
				status: 'foundSingle',
				person,
			})
		}

		// 2) Selected from kiosk_people (real kiosk UUID)
		const kioskId = rawId

		const rows = await db
			.select({
				id: kioskPeople.id,
				fullName: kioskPeople.fullName,
				userId: kioskPeople.userId,
				passcode: kioskPeople.passcode,
				role: user.role,
				isConsultantCached: kioskPeople.isConsultantCached,
			})
			.from(kioskPeople)
			.leftJoin(user, eq(kioskPeople.userId, user.id))
			.where(eq(kioskPeople.id, kioskId))
			.limit(1)

		if (rows.length === 0) {
			return NextResponse.json<IdentifyResponse>({
				status: 'notFound',
				suggestedName: null,
			})
		}

		const row = rows[0]
		const isConsultant =
			row.role !== null ? isConsultantRole(row.role) : row.isConsultantCached

		const person: PersonSummary = {
			id: row.id,
			fullName: row.fullName,
			userId: row.userId,
			isConsultant,
			hasPasscode: Boolean(row.passcode),
		}

		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person,
		})
	}

	// ─────────────────────────────
	// MODE B: identify by input string
	// (passcode or name, no prior selection)
	// ─────────────────────────────
	if (!('input' in body) || !body.input) {
		return NextResponse.json<IdentifyResponse>(
			{ status: 'notFound', suggestedName: null },
			{ status: 400 }
		)
	}

	const trimmed = body.input.trim()
	const isPasscode = /^[0-9]{6}$/.test(trimmed)

	// 1) Passcode search in kiosk_people
	if (isPasscode) {
		const rows = await db
			.select({
				id: kioskPeople.id,
				fullName: kioskPeople.fullName,
				userId: kioskPeople.userId,
				passcode: kioskPeople.passcode,
				role: user.role,
				isConsultantCached: kioskPeople.isConsultantCached,
			})
			.from(kioskPeople)
			.leftJoin(user, eq(kioskPeople.userId, user.id))
			.where(eq(kioskPeople.passcode, trimmed))
			.limit(1)

		if (rows.length === 0) {
			return NextResponse.json<IdentifyResponse>({
				status: 'notFound',
				suggestedName: null,
			})
		}

		const row = rows[0]
		const isConsultant =
			row.role !== null ? isConsultantRole(row.role) : row.isConsultantCached

		const person: PersonSummary = {
			id: row.id,
			fullName: row.fullName,
			userId: row.userId,
			isConsultant,
			hasPasscode: Boolean(row.passcode),
		}

		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person,
		})
	}

	// 2) Name search in kiosk_people
	const kioskRows = await db
		.select({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
			passcode: kioskPeople.passcode,
			role: user.role,
			isConsultantCached: kioskPeople.isConsultantCached,
		})
		.from(kioskPeople)
		.leftJoin(user, eq(kioskPeople.userId, user.id))
		.where(ilike(kioskPeople.fullName, `%${trimmed}%`))

	if (kioskRows.length === 1) {
		const row = kioskRows[0]
		const isConsultant =
			row.role !== null ? isConsultantRole(row.role) : row.isConsultantCached

		const person: PersonSummary = {
			id: row.id,
			fullName: row.fullName,
			userId: row.userId,
			isConsultant,
			hasPasscode: Boolean(row.passcode),
		}

		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person,
		})
	}

	if (kioskRows.length > 1) {
		const people: PersonSummary[] = kioskRows.map((row) => {
			const isConsultant =
				row.role !== null ? isConsultantRole(row.role) : row.isConsultantCached

			return {
				id: row.id,
				fullName: row.fullName,
				userId: row.userId,
				isConsultant,
				hasPasscode: Boolean(row.passcode),
			}
		})

		return NextResponse.json<IdentifyResponse>({
			status: 'multipleMatches',
			people,
		})
	}

	// 3) No kiosk_people matches → look in user table, and create kiosk_people entries
	const userRows = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.where(ilike(user.name, `%${trimmed}%`))

	if (userRows.length === 0) {
		return NextResponse.json<IdentifyResponse>({
			status: 'notFound',
			suggestedName: trimmed,
		})
	}

	const newPersons: PersonSummary[] = []
	for (const u of userRows) {
		const created = await createKioskPersonFromUserRow(u)
		if (created) newPersons.push(created)
	}

	if (newPersons.length === 1) {
		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person: newPersons[0],
		})
	}

	return NextResponse.json<IdentifyResponse>({
		status: 'multipleMatches',
		people: newPersons,
	})
}
