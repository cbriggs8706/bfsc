// db/queries/shifts/shift-report-day.ts

import { db, reservations, resources, user } from '@/db'
import {
	weeklyShifts,
	kioskShiftLogs,
	kioskVisitLogs,
	kioskPeople,
	kioskVisitPurposes,
} from '@/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'
import { TodayShift } from '@/types/shift-report'
import { ReservationStatus } from '@/types/resource'

//CORRECTED TIMEZONES

/* ======================================================
 * Helpers
 * ==================================================== */

function toReservationStatus(value: string): ReservationStatus {
	switch (value) {
		case 'pending':
		case 'confirmed':
		case 'denied':
		case 'cancelled':
			return value
		default:
			throw new Error(`Invalid reservation status: ${value}`)
	}
}

/* ======================================================
 * Query
 * ==================================================== */

/**
 * Get a full shift report for a calendar day
 * - dateStr is a LOCAL calendar date (YYYY-MM-DD)
 * - all DB timestamps are stored & queried in UTC
 */
export async function getShiftReportDay(dateStr: string, timeZone: string) {
	/* --------------------------------------------
	 * 1️⃣ Convert calendar day → UTC window
	 * ------------------------------------------ */

	const localDate = parseISO(dateStr)

	// Convert calendar day boundaries to UTC
	const startUtc = fromZonedTime(startOfDay(localDate), timeZone)
	const endUtc = fromZonedTime(endOfDay(localDate), timeZone)

	// Correct weekday (must be computed in center TZ)
	const weekday = toZonedTime(startUtc, timeZone).getDay()

	/* --------------------------------------------
	 * 2️⃣ Load weekly shifts for this weekday
	 * ------------------------------------------ */

	const shifts = await db
		.select()
		.from(weeklyShifts)
		.where(eq(weeklyShifts.weekday, weekday))
		.orderBy(asc(weeklyShifts.startTime))

	/* --------------------------------------------
	 * 3️⃣ Load workers (check-ins)
	 * ------------------------------------------ */

	const workers = await db
		.select({
			shiftLogId: kioskShiftLogs.id,
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

	/* --------------------------------------------
	 * 4️⃣ Load patrons (visits)
	 * ------------------------------------------ */

	const patrons = await db
		.select({
			visitId: kioskVisitLogs.id,
			personId: kioskVisitLogs.personId,
			arrivedAt: kioskVisitLogs.createdAt,
			departedAt: kioskVisitLogs.departedAt,
			fullName: kioskPeople.fullName,
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

	/* --------------------------------------------
	 * 5️⃣ Load reservations
	 * ------------------------------------------ */

	const allReservations = await db
		.select({
			id: reservations.id,
			startTime: reservations.startTime,
			endTime: reservations.endTime,
			status: reservations.status,
			resourceName: resources.name,
			patronName: user.name,
			patronEmail: user.email,
		})
		.from(reservations)
		.innerJoin(resources, eq(reservations.resourceId, resources.id))
		.innerJoin(user, eq(reservations.userId, user.id))
		.where(
			and(
				gte(reservations.startTime, startUtc),
				lte(reservations.startTime, endUtc)
			)
		)

	/* --------------------------------------------
	 * 6️⃣ Build shift buckets
	 * ------------------------------------------ */

	const results: TodayShift[] = shifts.map((shift) => {
		const [sh, sm] = shift.startTime.split(':').map(Number)
		const [eh, em] = shift.endTime.split(':').map(Number)

		const shiftStartLocal = new Date(localDate)
		shiftStartLocal.setHours(sh, sm, 0, 0)

		const shiftEndLocal = new Date(localDate)
		shiftEndLocal.setHours(eh, em, 0, 0)

		const shiftStartUtc = fromZonedTime(shiftStartLocal, timeZone)
		const shiftEndUtc = fromZonedTime(shiftEndLocal, timeZone)

		return {
			shiftId: shift.id,
			weekday,
			startTime: shift.startTime,
			endTime: shift.endTime,
			centerTimeZone: timeZone,

			workers: workers
				.filter(
					(w) => w.arrivalAt >= shiftStartUtc && w.arrivalAt <= shiftEndUtc
				)
				.map((w) => ({
					shiftLogId: w.shiftLogId,
					userId: w.userId,
					fullName: w.fullName,
					profileImageUrl: w.profileImageUrl,
					arrivalAt: w.arrivalAt,
					actualDepartureAt: w.actualDepartureAt,
				})),

			patrons: patrons
				.filter(
					(p) => p.arrivedAt >= shiftStartUtc && p.arrivedAt <= shiftEndUtc
				)
				.map((p) => ({
					visitId: p.visitId,
					fullName: p.fullName,
					purposeName: p.purposeName,
					arrivedAt: p.arrivedAt,
					departedAt: p.departedAt,
				})),

			reservations: allReservations
				.filter(
					(r) => r.startTime >= shiftStartUtc && r.startTime <= shiftEndUtc
				)
				.map((r) => ({
					id: r.id,
					resourceName: r.resourceName,
					startTime: format(r.startTime, 'HH:mm'),
					endTime: format(r.endTime, 'HH:mm'),
					status: toReservationStatus(r.status),
					patronName: r.patronName ?? r.patronEmail,
				})),
		}
	})

	/* --------------------------------------------
	 * 7️⃣ Off-shift activity bucket
	 * ------------------------------------------ */

	const assignedWorkerIds = new Set(
		results.flatMap((r) => r.workers.map((w) => w.userId))
	)
	const assignedPatronIds = new Set(
		results.flatMap((r) => r.patrons.map((p) => p.visitId))
	)
	const assignedReservationIds = new Set(
		results.flatMap((r) => r.reservations.map((r) => r.id))
	)

	const offShift: TodayShift[] =
		workers.length > 0 || patrons.length > 0
			? [
					{
						shiftId: 'off-shift',
						weekday,
						startTime: '—',
						endTime: '—',
						centerTimeZone: timeZone,

						workers: workers.filter((w) => !assignedWorkerIds.has(w.userId)),
						patrons: patrons.filter((p) => !assignedPatronIds.has(p.visitId)),
						reservations: allReservations
							.filter((r) => !assignedReservationIds.has(r.id))
							.map((r) => ({
								id: r.id,
								resourceName: r.resourceName,
								startTime: format(r.startTime, 'HH:mm'),
								endTime: format(r.endTime, 'HH:mm'),
								status: toReservationStatus(r.status),
								patronName: r.patronName ?? r.patronEmail,
							})),
					},
			  ]
			: []

	return {
		date: dateStr,
		shifts: results,
		offShift,
	}
}
