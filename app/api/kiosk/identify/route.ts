// app/api/kiosk/identify/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { and, eq, ilike, or } from 'drizzle-orm'
import { isConsultantRole } from '@/lib/isConsultantRole'

export async function POST(req: Request) {
	const { input } = (await req.json()) as { input: string }

	const trimmed = input.trim()

	// Passcode lookup (6 digits)
	const isPasscode = /^[0-9]{6}$/.test(trimmed)

	if (isPasscode) {
		const person = await db.query.kioskPeople.findFirst({
			where: eq(kioskPeople.passcode, trimmed),
			with: {
				user: true, // if you set up relations in Drizzle
			} as any,
		})

		if (!person) {
			return NextResponse.json({ status: 'notFound' as const })
		}

		const role = (person as any).user?.role ?? null
		const isConsultant = isConsultantRole(role)

		return NextResponse.json({
			status: 'foundSingle' as const,
			person: {
				id: person.id,
				fullName: person.fullName,
				userId: person.userId,
				isConsultant,
				hasPasscode: !!person.passcode,
			},
		})
	}

	// Name search (very simple: match kioskPeople or user)
	// You can tune this later (split first/last, etc.)
	const nameMatches = await db
		.select({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
			passcode: kioskPeople.passcode,
			role: user.role,
		})
		.from(kioskPeople)
		.leftJoin(user, eq(kioskPeople.userId, user.id))
		.where(ilike(kioskPeople.fullName, `%${trimmed}%`))

	if (nameMatches.length === 0) {
		return NextResponse.json({
			status: 'notFound' as const,
			suggestedName: trimmed,
		})
	}

	if (nameMatches.length === 1) {
		const m = nameMatches[0]
		const isConsultant = isConsultantRole(m.role ?? null)

		return NextResponse.json({
			status: 'foundSingle' as const,
			person: {
				id: m.id,
				fullName: m.fullName,
				userId: m.userId,
				isConsultant,
				hasPasscode: !!m.passcode,
			},
		})
	}

	// Multiple matches → let kiosk UI show a list
	return NextResponse.json({
		status: 'multipleMatches' as const,
		people: nameMatches.map((m) => ({
			id: m.id,
			fullName: m.fullName,
			userId: m.userId,
			isConsultant: isConsultantRole(m.role ?? null),
			hasPasscode: !!m.passcode,
		})),
	})
}
