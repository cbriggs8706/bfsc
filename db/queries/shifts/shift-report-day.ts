// db/queries/shifts/shift-report-day.ts
import { db, reservation, resource, user } from '@/db'
import {
	weeklyShifts,
	kioskShiftLogs,
	kioskVisitLogs,
	kioskPeople,
	kioskVisitPurposes,
} from '@/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'
import { TodayShift } from '@/types/shift-report'
import { ReservationStatus } from '@/types/resource'

const TZ = 'America/Boise'

function toReservationStatus(value: string): ReservationStatus {
	switch (value) {
		case 'pending':
		case 'approved':
		case 'denied':
		case 'cancelled':
			return value
		default:
			throw new Error(`Invalid reservation status: ${value}`)
	}
}

export async function getShiftReportDay(dateStr: string) {
	const dayBoise = toZonedTime(parseISO(dateStr), TZ)
	const weekday = dayBoise.getDay()

	const startUtc = fromZonedTime(startOfDay(dayBoise), TZ)
	const endUtc = fromZonedTime(endOfDay(dayBoise), TZ)

	const shifts = await db
		.select()
		.from(weeklyShifts)
		.where(eq(weeklyShifts.weekday, weekday))
		.orderBy(asc(weeklyShifts.startTime))

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

	const reservations = await db
		.select({
			id: reservation.id,
			startTime: reservation.startTime,
			endTime: reservation.endTime,
			status: reservation.status,
			resourceName: resource.name,
			patronName: user.name,
			patronEmail: user.email,
		})
		.from(reservation)
		.innerJoin(resource, eq(reservation.resourceId, resource.id))
		.innerJoin(user, eq(reservation.userId, user.id))
		.where(
			and(
				gte(reservation.startTime, startUtc),
				lte(reservation.startTime, endUtc)
			)
		)

	const results: TodayShift[] = shifts.map((shift) => {
		const [sh, sm] = shift.startTime.split(':').map(Number)
		const [eh, em] = shift.endTime.split(':').map(Number)

		const shiftStartBoise = new Date(dayBoise)
		shiftStartBoise.setHours(sh, sm, 0, 0)

		const shiftEndBoise = new Date(dayBoise)
		shiftEndBoise.setHours(eh, em, 0, 0)

		const shiftStartUtc = fromZonedTime(shiftStartBoise, TZ)
		const shiftEndUtc = fromZonedTime(shiftEndBoise, TZ)

		const reservationsInShift = reservations
			.filter((r) => r.startTime >= shiftStartUtc && r.startTime <= shiftEndUtc)
			.map((r) => ({
				id: r.id,
				resourceName: r.resourceName,
				startTime: format(r.startTime, 'HH:mm'),
				endTime: format(r.endTime, 'HH:mm'),
				status: toReservationStatus(r.status),
				patronName: r.patronName ?? r.patronEmail,
			}))

		const workersInShift = workers
			.filter((c) => c.arrivalAt >= shiftStartUtc && c.arrivalAt <= shiftEndUtc)
			.map((c) => ({
				shiftLogId: c.shiftLogId,
				userId: c.userId,
				fullName: c.fullName,
				profileImageUrl: c.profileImageUrl,
				arrivalAt: c.arrivalAt,
				actualDepartureAt: c.actualDepartureAt, // may be null
			}))

		const patronsInShift = patrons
			.filter((p) => p.arrivedAt >= shiftStartUtc && p.arrivedAt <= shiftEndUtc)
			.map((p) => ({
				visitId: p.visitId,
				fullName: p.fullName,
				purposeName: p.purposeName,
				arrivedAt: p.arrivedAt,
				departedAt: p.departedAt, // may be null
			}))

		return {
			shiftId: shift.id,
			weekday,
			startTime: shift.startTime,
			endTime: shift.endTime,
			workers: workersInShift,
			patrons: patronsInShift,
			reservations: reservationsInShift,
		}
	})

	const assignedWorkers = new Set(
		results.flatMap((r) => r.workers.map((c) => c.userId))
	)
	const assignedPatrons = new Set(
		results.flatMap((r) => r.patrons.map((p) => p.visitId))
	)

	const assignedReservationIds = new Set(
		results.flatMap((r) => r.reservations.map((res) => res.id))
	)

	const offShiftResults: TodayShift[] =
		workers.length > 0 || patrons.length > 0
			? [
					{
						shiftId: 'off-shift',
						weekday,
						startTime: '—',
						endTime: '—',
						workers: workers
							.filter((c) => !assignedWorkers.has(c.userId))
							.map((c) => ({
								shiftLogId: c.shiftLogId,
								userId: c.userId,
								fullName: c.fullName,
								profileImageUrl: c.profileImageUrl,
								arrivalAt: c.arrivalAt,
								actualDepartureAt: c.actualDepartureAt,
							})),
						patrons: patrons
							.filter((p) => !assignedPatrons.has(p.visitId))
							.map((p) => ({
								visitId: p.visitId,
								fullName: p.fullName,
								purposeName: p.purposeName,
								arrivedAt: p.arrivedAt,
								departedAt: p.departedAt,
							})),
						reservations: reservations
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
		offShift: offShiftResults,
	}
}
