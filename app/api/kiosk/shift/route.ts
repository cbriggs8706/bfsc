// app/api/kiosk/shift/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema/tables/kiosk'
import { eq } from 'drizzle-orm'

type ShiftRequest = {
	personId: string
	expectedDepartureAt: string // "HH:MM"
}

export async function POST(req: Request) {
	const body = (await req.json()) as ShiftRequest

	if (!body.personId || !body.expectedDepartureAt) {
		return NextResponse.json(
			{ error: 'Missing personId or expectedDepartureAt' },
			{ status: 400 }
		)
	}

	// 1. Get userId from kiosk_people
	const person = await db.query.kioskPeople.findFirst({
		columns: { userId: true },
		where: eq(kioskPeople.id, body.personId),
	})

	if (!person || !person.userId) {
		return NextResponse.json(
			{ error: 'This consultant has no linked userId' },
			{ status: 400 }
		)
	}

	// 2. Combine today's date with provided time (HH:MM)
	const now = new Date()
	const [hourStr, minuteStr] = body.expectedDepartureAt.split(':')
	const hours = Number(hourStr)
	const minutes = Number(minuteStr)

	const expectedDepartureDate = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hours,
		minutes,
		0,
		0
	)

	// 3. Insert shift log
	const [created] = await db
		.insert(kioskShiftLogs)
		.values({
			personId: body.personId,
			userId: person.userId,
			expectedDepartureAt: expectedDepartureDate,
		})
		.returning()

	return NextResponse.json({ success: true, shift: created })
}
