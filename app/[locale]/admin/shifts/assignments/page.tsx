// app/[locale]/admin/shifts/assignments/page.tsx
import { Metadata } from 'next'
import { eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/db'
import {
	operatingHours,
	weeklyShifts,
	shiftAssignments,
	shiftRecurrences,
} from '@/db/schema/tables/shifts'
import { user } from '@/db/schema/tables/auth'
import { ShiftScheduler } from '@/components/admin/shift/ShiftScheduler'
import { PrintScheduleButton } from '@/components/admin/shift/PrintScheduleButton'
import { ShiftSchedulePrint } from '@/components/admin/shift/ShiftSchedulePrint'

export const metadata: Metadata = {
	title: 'Shift Schedule',
}

/* ======================================================
 * Types
 * ==================================================== */

type Day = {
	weekday: number
	label: string
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
	isActive: boolean
	notes: string | null
	recurrences: ShiftRecurrence[]
}

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userId: string
	isPrimary: boolean
	userName: string | null
	userRole: string
	userEmail: string
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

export default async function ShiftsPage() {
	/* -----------------------------------------------------
	 * 1) Active operating days
	 * --------------------------------------------------- */
	const activeDays = await db
		.select({ weekday: operatingHours.weekday })
		.from(operatingHours)
		.where(eq(operatingHours.isClosed, false))

	const activeWeekdays = activeDays.map((d) => d.weekday)

	if (activeWeekdays.length === 0) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-semibold">Shift Schedule</h1>
				<p className="text-muted-foreground">
					No operating days are configured.
				</p>
			</div>
		)
	}

	/* -----------------------------------------------------
	 * 2) Assignments with user info
	 * --------------------------------------------------- */
	const assignments: Assignment[] = await db
		.select({
			id: shiftAssignments.id,
			shiftRecurrenceId: shiftAssignments.shiftRecurrenceId,
			userId: shiftAssignments.userId,
			isPrimary: shiftAssignments.isPrimary,
			userName: user.name,
			userRole: user.role,
			userEmail: user.email,
		})
		.from(shiftAssignments)
		.innerJoin(user, eq(shiftAssignments.userId, user.id))

	/* -----------------------------------------------------
	 * 3) Consultants
	 * --------------------------------------------------- */
	const consultants = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.where(ne(user.role, 'Patron'))

	/* -----------------------------------------------------
	 * 4) Shifts + Recurrences (flat rows)
	 * --------------------------------------------------- */
	const rows = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			isActive: weeklyShifts.isActive,
			notes: weeklyShifts.notes,

			recurrenceId: shiftRecurrences.id,
			label: shiftRecurrences.label,
			weekOfMonth: shiftRecurrences.weekOfMonth,
			recurrenceActive: shiftRecurrences.isActive,
			sortOrder: shiftRecurrences.sortOrder,
		})
		.from(weeklyShifts)
		.leftJoin(shiftRecurrences, eq(shiftRecurrences.shiftId, weeklyShifts.id))
		.where(inArray(weeklyShifts.weekday, activeWeekdays))

	/* -----------------------------------------------------
	 * 5) Normalize into ShiftWithRecurrences[]
	 * --------------------------------------------------- */
	const shiftMap = new Map<string, ShiftWithRecurrences>()

	for (const r of rows) {
		if (!shiftMap.has(r.shiftId)) {
			shiftMap.set(r.shiftId, {
				id: r.shiftId,
				weekday: r.weekday,
				startTime: r.startTime,
				endTime: r.endTime,
				isActive: r.isActive,
				notes: r.notes,
				recurrences: [],
			})
		}

		if (r.recurrenceId) {
			const recurrences = shiftMap.get(r.shiftId)!.recurrences
			recurrences.push({
				id: r.recurrenceId,
				label: r.label!,
				weekOfMonth: r.weekOfMonth,
				isActive: r.recurrenceActive!,
				sortOrder: r.sortOrder!,
			})
		}
	}

	/* -----------------------------------------------------
	 * 6) Sort recurrences correctly (1st → 4th Sunday)
	 * --------------------------------------------------- */
	for (const shift of shiftMap.values()) {
		shift.recurrences.sort((a, b) => {
			const aw = a.weekOfMonth ?? 0
			const bw = b.weekOfMonth ?? 0
			if (aw !== bw) return aw - bw
			return a.sortOrder - b.sortOrder
		})
	}

	const shifts: ShiftWithRecurrences[] = Array.from(shiftMap.values())

	/* -----------------------------------------------------
	 * 7) Filter print days (no empty Fri/Sat)
	 * --------------------------------------------------- */
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

	/* -----------------------------------------------------
	 * UI
	 * --------------------------------------------------- */
	return (
		<div className="p-4 space-y-4">
			{/* Interactive (screen only) */}
			<div className="no-print">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Shift Schedule</h1>
						<p className="text-sm text-muted-foreground">
							Drag people between shifts.
						</p>
					</div>

					<PrintScheduleButton />
				</div>

				<ShiftScheduler
					days={days}
					shifts={shifts}
					assignments={assignments}
					consultants={consultants}
				/>
			</div>

			{/* Print-only (single landscape page) */}
			<div className="print-only">
				<ShiftSchedulePrint
					days={days}
					shifts={shifts}
					assignments={assignments}
				/>
			</div>
		</div>
	)
}
