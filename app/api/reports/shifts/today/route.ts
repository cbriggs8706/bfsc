// app/api/reports/shifts/today/route.ts

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
import { startOfDay, endOfDay } from 'date-fns'

const TZ = 'America/Boise'

export async function GET() {
	// ----------------------------------------
	// 1. Establish "today" in Boise
	// ----------------------------------------
	const nowUtc = new Date()
	const todayBoise = toZonedTime(nowUtc, TZ)
	const weekday = todayBoise.getDay()

	const startOfTodayBoise = startOfDay(todayBoise)
	const endOfTodayBoise = endOfDay(todayBoise)

	const startOfTodayUtc = fromZonedTime(startOfTodayBoise, TZ)
	const endOfTodayUtc = fromZonedTime(endOfTodayBoise, TZ)

	// ----------------------------------------
	// 2. Load scheduled shifts for today
	// ----------------------------------------
	const shifts = await db
		.select()
		.from(weeklyShifts)
		.where(eq(weeklyShifts.weekday, weekday))

	// ----------------------------------------
	// 3. Load ALL consultant arrivals today
	// ----------------------------------------
	const allConsultantsToday = await db
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
				gte(kioskShiftLogs.arrivalAt, startOfTodayUtc),
				lte(kioskShiftLogs.arrivalAt, endOfTodayUtc)
			)
		)

	// ----------------------------------------
	// 4. Load ALL patrons today
	// ----------------------------------------
	const allPatronsToday = await db
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
				gte(kioskVisitLogs.createdAt, startOfTodayUtc),
				lte(kioskVisitLogs.createdAt, endOfTodayUtc)
			)
		)

	// ----------------------------------------
	// 5. Build shifts using ARRIVAL-based logic
	// ----------------------------------------
	const results = shifts.map((shift) => {
		const [sh, sm] = shift.startTime.split(':').map(Number)
		const [eh, em] = shift.endTime.split(':').map(Number)

		const shiftStartBoise = new Date(todayBoise)
		shiftStartBoise.setHours(sh, sm, 0, 0)

		const shiftEndBoise = new Date(todayBoise)
		shiftEndBoise.setHours(eh, em, 0, 0)

		const shiftStartUtc = fromZonedTime(shiftStartBoise, TZ)
		const shiftEndUtc = fromZonedTime(shiftEndBoise, TZ)

		// Consultants are assigned ONLY if they ARRIVE during the shift
		const consultantsInShift = allConsultantsToday.filter(
			(c) => c.arrivalAt >= shiftStartUtc && c.arrivalAt <= shiftEndUtc
		)

		// Patrons must ARRIVE during the shift
		const patronsInShift = allPatronsToday.filter(
			(p) => p.arrivedAt >= shiftStartUtc && p.arrivedAt <= shiftEndUtc
		)

		return {
			shiftId: shift.id,
			weekday,
			startTime: shift.startTime,
			endTime: shift.endTime,
			consultants: consultantsInShift,
			patrons: patronsInShift,
		}
	})

	// ----------------------------------------
	// 6. Off-shift = NOT assigned to any shift
	// ----------------------------------------
	const assignedConsultantIds = new Set(
		results.flatMap((r) => r.consultants.map((c) => c.userId))
	)

	const assignedPatronIds = new Set(
		results.flatMap((r) => r.patrons.map((p) => p.visitId))
	)

	const consultantsOutsideShifts = allConsultantsToday.filter(
		(c) => !assignedConsultantIds.has(c.userId)
	)

	const patronsOutsideShifts = allPatronsToday.filter(
		(p) => !assignedPatronIds.has(p.visitId)
	)

	// ----------------------------------------
	// 7. Final response
	// ----------------------------------------
	return NextResponse.json({
		shifts: results,
		offShift: {
			consultants: consultantsOutsideShifts,
			patrons: patronsOutsideShifts,
		},
	})
}
