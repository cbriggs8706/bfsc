// app/api/kiosk/identify/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople, KioskPeopleInsert } from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { eq, ilike } from 'drizzle-orm'
import { isWorkerRole } from '@/lib/is-worker-role'
import { normalizeFullNameForStorage } from '@/lib/names'

type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isWorker: boolean
	hasPasscode: boolean
}

type KioskRow = {
	id: string
	fullName: string
	userId: string | null
	passcode: string | null
	role: string | null
	isWorkerCached: boolean
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

	const isWorker = isWorkerRole(u.role)

	const insert: KioskPeopleInsert = {
		fullName: normalizeFullNameForStorage(u.name),
		email: u.email,
		userId: u.id,
		isWorkerCached: isWorker,
	}

	const [created] = await db.insert(kioskPeople).values(insert).returning()

	return {
		id: created.id,
		fullName: created.fullName,
		userId: created.userId,
		isWorker,
		hasPasscode: Boolean(created.passcode),
	}
}

async function reconcileKioskRow(row: KioskRow): Promise<PersonSummary> {
	let nextRow = row
	let linkedRole = row.role

	if (!row.userId) {
		const normalizedFullName = normalizeFullNameForStorage(row.fullName)
		const userRows = await db
			.select({
				id: user.id,
				role: user.role,
			})
			.from(user)
			.where(ilike(user.name, normalizedFullName))
			.limit(2)

		if (userRows.length === 1) {
			const matchedUser = userRows[0]
			const nextIsWorker = isWorkerRole(matchedUser.role)

			const [updated] = await db
				.update(kioskPeople)
				.set({
					userId: matchedUser.id,
					isWorkerCached: nextIsWorker,
					updatedAt: new Date(),
				})
				.where(eq(kioskPeople.id, row.id))
				.returning({
					id: kioskPeople.id,
					fullName: kioskPeople.fullName,
					userId: kioskPeople.userId,
					passcode: kioskPeople.passcode,
					isWorkerCached: kioskPeople.isWorkerCached,
				})

			if (updated) {
				nextRow = {
					...row,
					id: updated.id,
					fullName: updated.fullName,
					userId: updated.userId,
					passcode: updated.passcode,
					isWorkerCached: updated.isWorkerCached,
				}
				linkedRole = matchedUser.role
			}
		}
	}

	const isWorker =
		linkedRole !== null ? isWorkerRole(linkedRole) : nextRow.isWorkerCached

	if (nextRow.isWorkerCached !== isWorker) {
		await db
			.update(kioskPeople)
			.set({
				isWorkerCached: isWorker,
				updatedAt: new Date(),
			})
			.where(eq(kioskPeople.id, nextRow.id))
		nextRow = {
			...nextRow,
			isWorkerCached: isWorker,
		}
	}

	return {
		id: nextRow.id,
		fullName: nextRow.fullName,
		userId: nextRow.userId,
		isWorker,
		hasPasscode: Boolean(nextRow.passcode),
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

			const isWorker = isWorkerRole(existingUser.role)

			if (existingKiosk) {
				const person: PersonSummary = {
					id: existingKiosk.id,
					fullName: existingKiosk.fullName,
					userId: existingKiosk.userId,
					isWorker,
					hasPasscode: Boolean(existingKiosk.passcode),
				}

				return NextResponse.json<IdentifyResponse>({
					status: 'foundSingle',
					person,
				})
			}

			// No kiosk_people entry yet: create one
			const insert: KioskPeopleInsert = {
				fullName: normalizeFullNameForStorage(existingUser.name),
				email: existingUser.email,
				userId: existingUser.id,
				isWorkerCached: isWorker,
			}

			const [created] = await db.insert(kioskPeople).values(insert).returning()

			const person: PersonSummary = {
				id: created.id,
				fullName: created.fullName,
				userId: created.userId,
				isWorker,
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
				isWorkerCached: kioskPeople.isWorkerCached,
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
		const person = await reconcileKioskRow(row)

		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person,
		})
	}

	// ─────────────────────────────
	// MODE B: identify by input string (name only)
	// ─────────────────────────────
	if (!('input' in body) || !body.input) {
		return NextResponse.json<IdentifyResponse>(
			{ status: 'notFound', suggestedName: null },
			{ status: 400 }
		)
	}

	const trimmed = body.input.trim()
	// 1) Name search in kiosk_people
	const kioskRows = await db
		.select({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
			passcode: kioskPeople.passcode,
			role: user.role,
			isWorkerCached: kioskPeople.isWorkerCached,
		})
		.from(kioskPeople)
		.leftJoin(user, eq(kioskPeople.userId, user.id))
		.where(ilike(kioskPeople.fullName, `%${trimmed}%`))

	if (kioskRows.length === 1) {
		const person = await reconcileKioskRow(kioskRows[0])

		return NextResponse.json<IdentifyResponse>({
			status: 'foundSingle',
			person,
		})
	}

	if (kioskRows.length > 1) {
		const people = await Promise.all(kioskRows.map(reconcileKioskRow))

		return NextResponse.json<IdentifyResponse>({
			status: 'multipleMatches',
			people,
		})
	}

	// 2) No kiosk_people matches → look in user table, and create kiosk_people entries
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
