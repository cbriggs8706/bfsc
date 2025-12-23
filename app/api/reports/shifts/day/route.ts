// app/api/reports/shifts/day/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
	weeklyShifts,
	kioskShiftLogs,
	kioskVisitLogs,
	kioskPeople,
} from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

const TZ = 'America/Boise'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const dateParam = searchParams.get('date')

	if (!dateParam) {
		return NextResponse.json({ error: 'Missing date param' }, { status: 400 })
	}

	// 1️⃣ Establish day in Boise
	const dayBoise = toZonedTime(parseISO(dateParam), TZ)
	const weekday = dayBoise.getDay()

	const startBoise = startOfDay(dayBoise)
	const endBoise = endOfDay(dayBoise)

	const startUtc = fromZonedTime(startBoise, TZ)
	const endUtc = fromZonedTime(endBoise, TZ)

	// 2️⃣ Scheduled shifts
	const shifts = await db
		.select()
		.from(weeklyShifts)
		.where(eq(weeklyShifts.weekday, weekday))

	// 3️⃣ Consultant arrivals
	const consultants = await db
		.select({
			userId: kioskShiftLogs.userId,
			personId: kioskShiftLogs.personId,
			arrivalAt: kioskShiftLogs.arrivalAt,
			actualDepartureAt: kioskShiftLogs.actualDepartureAt,
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(
			and(
				gte(kioskShiftLogs.arrivalAt, startUtc),
				lte(kioskShiftLogs.arrivalAt, endUtc)
			)
		)

	// 4️⃣ Patrons
	const patrons = await db
		.select({
			visitId: kioskVisitLogs.id,
			personId: kioskVisitLogs.personId,
			arrivedAt: kioskVisitLogs.createdAt,
			fullName: kioskPeople.fullName,
		})
		.from(kioskVisitLogs)
		.innerJoin(kioskPeople, eq(kioskVisitLogs.personId, kioskPeople.id))
		.where(
			and(
				gte(kioskVisitLogs.createdAt, startUtc),
				lte(kioskVisitLogs.createdAt, endUtc)
			)
		)

	// 5️⃣ Build shifts
	const results = shifts.map((shift) => {
		const [sh, sm] = shift.startTime.split(':').map(Number)
		const [eh, em] = shift.endTime.split(':').map(Number)

		const shiftStart = new Date(dayBoise)
		shiftStart.setHours(sh, sm, 0, 0)

		const shiftEnd = new Date(dayBoise)
		shiftEnd.setHours(eh, em, 0, 0)

		const shiftStartUtc = fromZonedTime(shiftStart, TZ)
		const shiftEndUtc = fromZonedTime(shiftEnd, TZ)

		return {
			shiftId: shift.id,
			weekday,
			startTime: shift.startTime,
			endTime: shift.endTime,
			consultants: consultants.filter(
				(c) => c.arrivalAt >= shiftStartUtc && c.arrivalAt <= shiftEndUtc
			),
			patrons: patrons.filter(
				(p) => p.arrivedAt >= shiftStartUtc && p.arrivedAt <= shiftEndUtc
			),
		}
	})

	// 6️⃣ Off-shift
	const assignedConsultants = new Set(
		results.flatMap((r) => r.consultants.map((c) => c.userId))
	)

	const assignedPatrons = new Set(
		results.flatMap((r) => r.patrons.map((p) => p.visitId))
	)

	return NextResponse.json({
		shifts: results,
		offShift: {
			consultants: consultants.filter(
				(c) => !assignedConsultants.has(c.userId)
			),
			patrons: patrons.filter((p) => !assignedPatrons.has(p.visitId)),
		},
	})
}
