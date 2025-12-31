// app/[locale]/(workers)/shifts/assignments/page.tsx

import { Metadata } from 'next'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/db'
import {
	operatingHours,
	weeklyShifts,
	shiftAssignments,
	shiftRecurrences,
} from '@/db/schema/tables/shifts'
import { user } from '@/db/schema/tables/auth'
import { ShiftScheduler } from '@/components/admin/shift/ShiftScheduler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { requireRole } from '@/utils/require-role'
import { Assignment, AssignmentRole, DaySimple, Shift } from '@/types/shifts'

export const metadata: Metadata = {
	title: 'Shift Schedule',
}
interface Props {
	params: Promise<{ locale: string }>
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

function isAssignmentRole(value: string): value is AssignmentRole {
	return value === 'worker' || value === 'shift_lead' || value === 'trainer'
}

const EDIT_ROLES = ['Admin', 'Director'] as const

export default async function ShiftsPage({ params }: Props) {
	const { locale } = await params
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director', 'Shift Lead', 'Worker'],
		`/${locale}/dashboard`
	)
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)

	const canEdit = EDIT_ROLES.includes(
		session?.user?.role as (typeof EDIT_ROLES)[number]
	)
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
				<h1 className="text-2xl font-semibold">{t('shifts.schedule')}</h1>
				<p className="text-muted-foreground">{t('shifts.noOp')}</p>
			</div>
		)
	}

	/* -----------------------------------------------------
	 * 2) Assignments with user info
	 * --------------------------------------------------- */
	const rawAssignments = await db
		.select({
			id: shiftAssignments.id,
			shiftRecurrenceId: shiftAssignments.shiftRecurrenceId,
			userId: shiftAssignments.userId,

			assignmentRole: shiftAssignments.assignmentRole, // string
			notes: shiftAssignments.notes,

			userName: user.name,
			userRole: user.role,
			userEmail: user.email,
		})
		.from(shiftAssignments)
		.innerJoin(user, eq(shiftAssignments.userId, user.id))

	const assignments: Assignment[] = rawAssignments.map((a) => ({
		...a,
		assignmentRole: isAssignmentRole(a.assignmentRole)
			? a.assignmentRole
			: 'worker', // safe fallback
	}))

	/* -----------------------------------------------------
	 * 3) Workers
	 * --------------------------------------------------- */
	const workers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.where(
			and(
				ne(user.role, 'Patron'),
				eq(user.isActiveWorker, true) // NEW
			)
		)

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
			type: weeklyShifts.type,
			recurrenceId: shiftRecurrences.id,
			label: shiftRecurrences.label,
			weekOfMonth: shiftRecurrences.weekOfMonth,
			recurrenceActive: shiftRecurrences.isActive,
			sortOrder: shiftRecurrences.sortOrder,
		})
		.from(weeklyShifts)
		.leftJoin(shiftRecurrences, eq(shiftRecurrences.shiftId, weeklyShifts.id))

	/* -----------------------------------------------------
	 * 5) Normalize into Shift[]
	 * --------------------------------------------------- */
	const shiftMap = new Map<string, Shift>()

	for (const r of rows) {
		if (!shiftMap.has(r.shiftId)) {
			shiftMap.set(r.shiftId, {
				id: r.shiftId,
				weekday: r.weekday,
				startTime: r.startTime,
				endTime: r.endTime,
				isActive: r.isActive,
				type: r.type,
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

	const shifts: Shift[] = Array.from(shiftMap.values())

	/* -----------------------------------------------------
	 * 7) Filter print days (no empty Fri/Sat)
	 * --------------------------------------------------- */
	const shiftsByWeekday = new Map<number, Shift[]>()

	for (const s of shifts) {
		const list = shiftsByWeekday.get(s.weekday) ?? []
		list.push(s)
		shiftsByWeekday.set(s.weekday, list)
	}

	const days: DaySimple[] = activeWeekdays
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
				<div>
					<h1 className="text-3xl font-bold">{t('shifts.schedule')}</h1>
					<p className="text-sm text-muted-foreground">
						{t('shifts.dragBetween')}
					</p>
				</div>

				<ShiftScheduler
					days={days}
					shifts={shifts}
					assignments={assignments}
					workers={workers}
					canEdit={canEdit}
				/>
			</div>
		</div>
	)
}
