// app/api/kiosk/shift/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema/tables/kiosk'
import { and, eq, isNull } from 'drizzle-orm'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { toUtcDateTimeInTz, ymdInTz } from '@/utils/time'

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

	// 1️⃣ Get linked userId
	const person = await db.query.kioskPeople.findFirst({
		columns: { userId: true },
		where: eq(kioskPeople.id, body.personId),
	})

	if (!person?.userId) {
		return NextResponse.json(
			{ error: 'This worker has no linked userId' },
			{ status: 400 }
		)
	}

	const userId = person.userId

	// 2️⃣ Build expected departure datetime (today + HH:MM)
	const centerTime = await getCenterTimeConfig()
	const todayCenterYmd = ymdInTz(new Date(), centerTime.timeZone)
	const expectedDepartureDate = toUtcDateTimeInTz(
		todayCenterYmd,
		body.expectedDepartureAt,
		centerTime.timeZone
	)

	// 3️⃣ TRANSACTION: close existing shift, then open new one
	const result = await db.transaction(async (tx) => {
		// close any existing active shift
		await tx
			.update(kioskShiftLogs)
			.set({ actualDepartureAt: new Date() })
			.where(
				and(
					eq(kioskShiftLogs.personId, body.personId),
					isNull(kioskShiftLogs.actualDepartureAt)
				)
			)

		// insert new shift (NOW TYPE-SAFE)
		const [created] = await tx
			.insert(kioskShiftLogs)
			.values({
				personId: body.personId,
				userId, // ← now guaranteed string
				expectedDepartureAt: expectedDepartureDate,
			})
			.returning()

		return created
	})

	return NextResponse.json({ success: true, shift: result })
}
