// app/api/kiosk/shift/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskShiftLogs } from '@/db/schema/tables/kiosk'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { and, eq } from 'drizzle-orm'
import { isConsultantRole } from '@/lib/isConsultantRole'
import { user } from '@/db/schema/tables/auth'

export async function POST(req: Request) {
	const { personId, expectedDepartureAt } = (await req.json()) as {
		personId: string
		expectedDepartureAt: string // ISO string from client
	}

	// ensure this person is a consultant with a userId
	const person = await db
		.select({
			id: kioskPeople.id,
			userId: kioskPeople.userId,
			fullName: kioskPeople.fullName,
		})
		.from(kioskPeople)
		.where(eq(kioskPeople.id, personId))
		.limit(1)

	if (!person[0] || !person[0].userId) {
		return NextResponse.json(
			{ error: 'Person is not linked to a consultant user.' },
			{ status: 400 }
		)
	}

	const u = await db.query.user.findFirst({
		where: eq(user.id, person[0].userId),
	})

	if (!u || !isConsultantRole(u.role)) {
		return NextResponse.json(
			{ error: 'User is not in a consultant role.' },
			{ status: 400 }
		)
	}

	const expected = new Date(expectedDepartureAt)

	const [shift] = await db
		.insert(kioskShiftLogs)
		.values({
			personId: person[0].id,
			userId: person[0].userId,
			expectedDepartureAt: expected,
		})
		.returning()

	return NextResponse.json({ shift })
}
