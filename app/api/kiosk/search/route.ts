// app/api/kiosk/search/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { ilike, eq } from 'drizzle-orm'

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

type SearchPerson = {
	id: string
	fullName: string
	userId: string | null
	isConsultant: boolean
	hasPasscode: boolean
	source: 'kiosk' | 'user'
}

export async function GET(request: Request) {
	const url = new URL(request.url)
	const q = url.searchParams.get('q')?.trim() ?? ''

	if (q.length < 2) {
		return NextResponse.json({ people: [] as SearchPerson[] })
	}

	// 1) Search kiosk_people first
	const kioskRows = await db
		.select({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
			passcode: kioskPeople.passcode,
			role: user.role,
		})
		.from(kioskPeople)
		.leftJoin(user, eq(kioskPeople.userId, user.id))
		.where(ilike(kioskPeople.fullName, `${q}%`))
		.limit(10)

	const kioskPeopleSummaries: SearchPerson[] = kioskRows.map((row) => ({
		id: row.id,
		fullName: row.fullName,
		userId: row.userId,
		isConsultant: isConsultantRole(row.role),
		hasPasscode: Boolean(row.passcode),
		source: 'kiosk',
	}))

	const kioskUserIds = kioskPeopleSummaries
		.map((p) => p.userId)
		.filter((id): id is string => id !== null)

	// 2) Search user table, but exclude users already mirrored in kiosk_people
	const userRows = await db
		.select({
			id: user.id,
			fullName: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.where(ilike(user.name, `${q}%`))
		.limit(10)

	const userOnlyRows = userRows.filter((u) => {
		if (!u.fullName) return false
		return !kioskUserIds.includes(u.id)
	})

	const userSummaries: SearchPerson[] = userOnlyRows.map((u) => ({
		id: `user:${u.id}`, // mark as coming from user table
		fullName: u.fullName as string,
		userId: u.id,
		isConsultant: isConsultantRole(u.role),
		hasPasscode: false,
		source: 'user',
	}))

	const combined: SearchPerson[] = [...kioskPeopleSummaries, ...userSummaries]

	return NextResponse.json({ people: combined })
}
