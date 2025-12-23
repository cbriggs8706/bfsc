// db/queries/shifts/shift-report-print.ts
import { db } from '@/db'
import {
	kioskPeople,
	kioskShiftLogs,
	kioskVisitLogs,
	kioskVisitPurposes,
} from '@/db/schema'
import { and, eq, gte, lte, asc } from 'drizzle-orm'
import { startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import type {
	ShiftReportResponse,
	ShiftReportItem,
	ConsultantShift,
	PatronVisit,
} from '@/types/shift-report'

const TZ = 'America/Boise'

export async function getShiftReportPrintData(
	date: Date
): Promise<ShiftReportResponse> {
	// -----------------------------
	// 1) Day boundaries in Boise
	// -----------------------------
	const dayBoise = toZonedTime(date, TZ)
	const startBoise = startOfDay(dayBoise)
	const endBoise = endOfDay(dayBoise)

	const startUtc = fromZonedTime(startBoise, TZ)
	const endUtc = fromZonedTime(endBoise, TZ)

	// -----------------------------
	// 2) Load all consultant shift logs for the day
	//    (Sorted by consultant name)
	// -----------------------------
	const consultantLogs = await db
		.select({
			personId: kioskShiftLogs.personId,
			fullName: kioskPeople.fullName,
			arrivalAt: kioskShiftLogs.arrivalAt,
			expectedDepartureAt: kioskShiftLogs.expectedDepartureAt,
			actualDepartureAt: kioskShiftLogs.actualDepartureAt,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(
			and(
				gte(kioskShiftLogs.arrivalAt, startUtc),
				lte(kioskShiftLogs.arrivalAt, endUtc)
			)
		)
		.orderBy(asc(kioskPeople.fullName), asc(kioskShiftLogs.arrivalAt))

	// -----------------------------
	// 3) Load all patron visits for the day
	//    (Sorted by arrival time)
	// -----------------------------
	const patronVisits = await db
		.select({
			personId: kioskVisitLogs.personId,
			fullName: kioskPeople.fullName,
			signedInAt: kioskVisitLogs.createdAt,
			purposeName: kioskVisitPurposes.name,
		})
		.from(kioskVisitLogs)
		.innerJoin(kioskPeople, eq(kioskVisitLogs.personId, kioskPeople.id))
		.leftJoin(
			kioskVisitPurposes,
			eq(kioskVisitLogs.purposeId, kioskVisitPurposes.id)
		)
		.where(
			and(
				gte(kioskVisitLogs.createdAt, startUtc),
				lte(kioskVisitLogs.createdAt, endUtc)
			)
		)
		.orderBy(asc(kioskVisitLogs.createdAt), asc(kioskPeople.fullName))

	// -----------------------------
	// 4) Build report:
	//    patrons who signed in during each consultant's shift window
	// -----------------------------
	const report: ShiftReportItem[] = consultantLogs
		.map((c): ShiftReportItem | null => {
			const shiftEnd = c.actualDepartureAt ?? c.expectedDepartureAt

			const patronsForConsultant: PatronVisit[] = patronVisits
				.filter((p) => p.signedInAt >= c.arrivalAt && p.signedInAt <= shiftEnd)
				.map(
					(p): PatronVisit => ({
						personId: p.personId,
						fullName: p.fullName,
						signedInAt: p.signedInAt.toISOString(),
						purposeName: p.purposeName ?? null,
					})
				)

			// Collapse empty shifts (no patrons)
			if (patronsForConsultant.length === 0) return null

			const consultant: ConsultantShift = {
				personId: c.personId,
				fullName: c.fullName,
				profileImageUrl: null, // explicitly excluded for print
				arrivalAt: c.arrivalAt.toISOString(),
				expectedDepartureAt: c.expectedDepartureAt.toISOString(),
				actualDepartureAt: c.actualDepartureAt
					? c.actualDepartureAt.toISOString()
					: null,
			}

			return { consultant, patrons: patronsForConsultant }
		})
		.filter((x): x is ShiftReportItem => x !== null)

	return {
		date: startBoise.toISOString().slice(0, 10), // YYYY-MM-DD
		report,
	}
}
