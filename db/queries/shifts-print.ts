// db/queries/shifts-print.ts
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import {
	operatingHours,
	weeklyShifts,
	shiftAssignments,
	shiftRecurrences,
} from '@/db/schema/tables/shifts'
import { user } from '@/db/schema/tables/auth'

/* ======================================================
 * Types (print-safe, minimal)
 * ==================================================== */

type Day = {
	weekday: number
	label: string
}

type AssignmentRole = 'worker' | 'shift_lead' | 'trainer'

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userName: string | null
	assignmentRole: AssignmentRole
	notes: string | null
}

type ShiftRecurrence = {
	id: string
	label: string
	weekOfMonth: number | null
	isActive: boolean
	sortOrder: number
}

type ShiftWithRecurrences = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	type: string
	recurrences: ShiftRecurrence[]
}

const WEEKDAY_LABELS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

function isAssignmentRole(v: string): v is AssignmentRole {
	return v === 'worker' || v === 'shift_lead' || v === 'trainer'
}

/* ======================================================
 * Main query
 * ==================================================== */

export async function getShiftPrintData(): Promise<{
	days: Day[]
	shifts: ShiftWithRecurrences[]
	assignments: Assignment[]
}> {
	/* --------------------------------------------------
	 * 1) Active operating weekdays
	 * ------------------------------------------------ */
	const activeDays = await db
		.select({ weekday: operatingHours.weekday })
		.from(operatingHours)
		.where(eq(operatingHours.isClosed, false))

	const activeWeekdays = activeDays.map((d) => d.weekday)

	if (activeWeekdays.length === 0) {
		return { days: [], shifts: [], assignments: [] }
	}

	/* --------------------------------------------------
	 * 2) Assignments (print-safe fields only)
	 * ------------------------------------------------ */
	const rawAssignments = await db
		.select({
			id: shiftAssignments.id,
			shiftRecurrenceId: shiftAssignments.shiftRecurrenceId,
			assignmentRole: shiftAssignments.assignmentRole,
			notes: shiftAssignments.notes,
			userName: user.name,
		})
		.from(shiftAssignments)
		.innerJoin(user, eq(shiftAssignments.userId, user.id))

	const assignments: Assignment[] = rawAssignments.map((a) => ({
		id: a.id,
		shiftRecurrenceId: a.shiftRecurrenceId,
		notes: a.notes,
		userName: a.userName,
		assignmentRole: isAssignmentRole(a.assignmentRole)
			? a.assignmentRole
			: 'worker',
	}))

	/* --------------------------------------------------
	 * 3) Shifts + recurrences (flat rows)
	 * ------------------------------------------------ */
	const rows = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			type: weeklyShifts.type,
			recurrenceId: shiftRecurrences.id,
			label: shiftRecurrences.label,
			weekOfMonth: shiftRecurrences.weekOfMonth,
			recurrenceActive: shiftRecurrences.isActive,
			sortOrder: shiftRecurrences.sortOrder,
		})
		.from(weeklyShifts)
		.leftJoin(shiftRecurrences, eq(shiftRecurrences.shiftId, weeklyShifts.id))

	/* --------------------------------------------------
	 * 4) Normalize shifts
	 * ------------------------------------------------ */
	const shiftMap = new Map<string, ShiftWithRecurrences>()

	for (const r of rows) {
		if (!shiftMap.has(r.shiftId)) {
			shiftMap.set(r.shiftId, {
				id: r.shiftId,
				weekday: r.weekday,
				startTime: r.startTime,
				endTime: r.endTime,
				type: r.type,
				recurrences: [],
			})
		}

		if (r.recurrenceId) {
			shiftMap.get(r.shiftId)!.recurrences.push({
				id: r.recurrenceId,
				label: r.label!,
				weekOfMonth: r.weekOfMonth,
				isActive: r.recurrenceActive!,
				sortOrder: r.sortOrder!,
			})
		}
	}

	/* --------------------------------------------------
	 * 5) Sort recurrences correctly
	 * ------------------------------------------------ */
	for (const shift of shiftMap.values()) {
		shift.recurrences.sort((a, b) => {
			const aw = a.weekOfMonth ?? 0
			const bw = b.weekOfMonth ?? 0
			if (aw !== bw) return aw - bw
			return a.sortOrder - b.sortOrder
		})
	}

	const shifts = Array.from(shiftMap.values())

	/* --------------------------------------------------
	 * 6) Filter printable days (no empty columns)
	 * ------------------------------------------------ */
	const shiftsByWeekday = new Map<number, ShiftWithRecurrences[]>()

	for (const s of shifts) {
		const list = shiftsByWeekday.get(s.weekday) ?? []
		list.push(s)
		shiftsByWeekday.set(s.weekday, list)
	}

	const days: Day[] = activeWeekdays
		.sort((a, b) => a - b)
		.filter((weekday) =>
			(shiftsByWeekday.get(weekday) ?? []).some((s) => s.recurrences.length > 0)
		)
		.map((weekday) => ({
			weekday,
			label: WEEKDAY_LABELS[weekday],
		}))

	return { days, shifts, assignments }
}
