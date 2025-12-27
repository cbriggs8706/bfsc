// app/api/reports/shifts/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
	kioskShiftLogs,
	kioskVisitLogs,
	kioskPeople,
	kioskVisitPurposes,
} from '@/db/schema/tables/kiosk'
import { weeklyShifts } from '@/db/schema/tables/shifts'
import { and, eq, gte, lte, asc } from 'drizzle-orm'

type ShiftSlot = {
	slotId: string // `${date}|${weeklyShiftId}`
	date: string // YYYY-MM-DD
	weekday: number // 0-6
	weeklyShiftId: string
	startTime: string // "HH:MM"
	endTime: string // "HH:MM"
	label: string // "10:00–14:00"
	notes: string | null
	sortOrder: number
	startAtIso: string // UTC ISO
	endAtIso: string // UTC ISO
}

type SlotWorker = {
	kioskShiftLogId: string
	userId: string
	fullName: string
	arrivalAtIso: string
	expectedDepartureAtIso: string
}

type SlotPatron = {
	visitId: string
	fullName: string
	purposeName: string | null
	createdAtIso: string
}

export type ShiftSlotReport = ShiftSlot & {
	workers: SlotWorker[]
	patrons: SlotPatron[]
}

// ---- helpers ----
function pad2(n: number): string {
	return String(n).padStart(2, '0')
}

function ymdInTz(date: Date, timeZone: string): string {
	const dtf = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
	return dtf.format(date) // "YYYY-MM-DD"
}

function weekdayInTz(date: Date, timeZone: string): number {
	// 0=Sunday..6=Saturday
	const dtf = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
	const w = dtf.format(date)
	switch (w) {
		case 'Sun':
			return 0
		case 'Mon':
			return 1
		case 'Tue':
			return 2
		case 'Wed':
			return 3
		case 'Thu':
			return 4
		case 'Fri':
			return 5
		default:
			return 6
	}
}

/**
 * Convert "YYYY-MM-DD" + "HH:MM" in a named IANA TZ to a real UTC Date.
 * (No extra deps; works across DST.)
 */
function zonedDateToUtc(
	dateYmd: string,
	timeHHMM: string,
	timeZone: string
): Date {
	const [y, m, d] = dateYmd.split('-').map(Number)
	const [hh, mm] = timeHHMM.split(':').map(Number)

	// Start with a UTC guess:
	const utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0))

	// Figure out what local time that guess corresponds to in the target TZ:
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}).formatToParts(utcGuess)

	const get = (type: string): number =>
		Number(parts.find((p) => p.type === type)?.value ?? '0')

	const tzY = get('year')
	const tzM = get('month')
	const tzD = get('day')
	const tzH = get('hour')
	const tzMin = get('minute')
	const tzS = get('second')

	// This is what the guess "looks like" in the TZ, interpreted as UTC:
	const asIfUtc = Date.UTC(tzY, tzM - 1, tzD, tzH, tzMin, tzS, 0)

	// Desired local time interpreted as UTC:
	const desiredAsUtc = Date.UTC(y, m - 1, d, hh, mm, 0, 0)

	// Offset = observed - desired
	const offsetMs = asIfUtc - desiredAsUtc

	return new Date(utcGuess.getTime() - offsetMs)
}

function eachDayYmd(start: Date, end: Date, timeZone: string): string[] {
	const days: string[] = []

	// iterate in UTC, but compute date label in TZ
	const cursor = new Date(start.getTime())
	cursor.setUTCHours(0, 0, 0, 0)

	const endUtc = new Date(end.getTime())
	endUtc.setUTCHours(23, 59, 59, 999)

	while (cursor <= endUtc) {
		days.push(ymdInTz(cursor, timeZone))
		cursor.setUTCDate(cursor.getUTCDate() + 1)
	}
	// de-dupe in case TZ formatting folds edges
	return Array.from(new Set(days))
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const start = searchParams.get('start')
	const end = searchParams.get('end')

	if (!start || !end) {
		return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
	}

	// Treat the incoming values as ISO strings
	const startDate = new Date(start)
	const endDate = new Date(end)
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
	}

	// Center timezone for shift slots
	const timeZone = 'America/Boise'

	// 1) Pull active weekly shifts (schedule)
	const scheduled = await db
		.select({
			id: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			notes: weeklyShifts.notes,
			sortOrder: weeklyShifts.sortOrder,
		})
		.from(weeklyShifts)
		.where(eq(weeklyShifts.isActive, true))
		.orderBy(
			asc(weeklyShifts.weekday),
			asc(weeklyShifts.sortOrder),
			asc(weeklyShifts.startTime)
		)

	// 2) Build slots for each day in range
	const dayYmds = eachDayYmd(startDate, endDate, timeZone)

	const slots: ShiftSlot[] = []
	for (const dateYmd of dayYmds) {
		// compute weekday for this date in Boise
		const tmp = new Date(dateYmd + 'T12:00:00Z')
		const weekday = weekdayInTz(tmp, timeZone)

		const shiftsForDay = scheduled.filter((s) => s.weekday === weekday)
		for (const s of shiftsForDay) {
			const startAt = zonedDateToUtc(dateYmd, s.startTime, timeZone)
			const endAt = zonedDateToUtc(dateYmd, s.endTime, timeZone)

			// If endTime is past midnight (rare), handle by adding a day when end < start
			const endAtFixed =
				endAt < startAt
					? new Date(endAt.getTime() + 24 * 60 * 60 * 1000)
					: endAt

			const slotId = `${dateYmd}|${s.id}`
			slots.push({
				slotId,
				date: dateYmd,
				weekday,
				weeklyShiftId: s.id,
				startTime: s.startTime,
				endTime: s.endTime,
				label: `${s.startTime}–${s.endTime}`,
				notes: s.notes ?? null,
				sortOrder: s.sortOrder,
				startAtIso: startAt.toISOString(),
				endAtIso: endAtFixed.toISOString(),
			})
		}
	}

	// If there are no scheduled slots, return early
	if (slots.length === 0) {
		return NextResponse.json({ report: [] satisfies ShiftSlotReport[] })
	}

	// Overall min/max slot window for querying
	const minStartDate = new Date(
		slots.reduce(
			(min, s) => (s.startAtIso < min ? s.startAtIso : min),
			slots[0].startAtIso
		)
	)

	const maxEndDate = new Date(
		slots.reduce(
			(max, s) => (s.endAtIso > max ? s.endAtIso : max),
			slots[0].endAtIso
		)
	)

	// 3) Pull worker arrivals (kiosk_shift_logs.arrival_at) in the overall window
	const workerArrivals = await db
		.select({
			kioskShiftLogId: kioskShiftLogs.id,
			userId: kioskShiftLogs.userId,
			arrivalAt: kioskShiftLogs.arrivalAt,
			expectedDepartureAt: kioskShiftLogs.expectedDepartureAt,
			fullName: kioskPeople.fullName,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(
			and(
				gte(kioskShiftLogs.arrivalAt, minStartDate),
				lte(kioskShiftLogs.arrivalAt, maxEndDate)
			)
		)
		.orderBy(asc(kioskShiftLogs.arrivalAt))

	// 4) Pull patron visits in the overall window
	const patronVisits = await db
		.select({
			visitId: kioskVisitLogs.id,
			fullName: kioskPeople.fullName,
			purposeName: kioskVisitPurposes.name,
			createdAt: kioskVisitLogs.createdAt,
		})
		.from(kioskVisitLogs)
		.innerJoin(kioskPeople, eq(kioskVisitLogs.personId, kioskPeople.id))
		.leftJoin(
			kioskVisitPurposes,
			eq(kioskVisitLogs.purposeId, kioskVisitPurposes.id)
		)
		.where(
			and(
				gte(kioskVisitLogs.createdAt, minStartDate),
				lte(kioskVisitLogs.createdAt, maxEndDate)
			)
		)
		.orderBy(asc(kioskVisitLogs.createdAt))

	// 5) Bucket into slots (start time within slot window)
	const report: ShiftSlotReport[] = slots
		.sort((a, b) => {
			if (a.date !== b.date) return a.date.localeCompare(b.date)
			if (a.weekday !== b.weekday) return a.weekday - b.weekday
			if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
			return a.startTime.localeCompare(b.startTime)
		})
		.map((slot) => {
			const slotStart = new Date(slot.startAtIso).getTime()
			const slotEnd = new Date(slot.endAtIso).getTime()

			const workers: SlotWorker[] = workerArrivals
				.filter((c) => {
					const t = c.arrivalAt.getTime()
					return t >= slotStart && t < slotEnd
				})
				.map((c) => ({
					kioskShiftLogId: c.kioskShiftLogId,
					userId: c.userId,
					fullName: c.fullName,
					arrivalAtIso: c.arrivalAt.toISOString(),
					expectedDepartureAtIso: c.expectedDepartureAt.toISOString(),
				}))

			const patrons: SlotPatron[] = patronVisits
				.filter((p) => {
					const t = p.createdAt.getTime()
					return t >= slotStart && t < slotEnd
				})
				.map((p) => ({
					visitId: p.visitId,
					fullName: p.fullName,
					purposeName: p.purposeName ?? null,
					createdAtIso: p.createdAt.toISOString(),
				}))

			return { ...slot, workers, patrons }
		})

	return NextResponse.json({ report })
}
