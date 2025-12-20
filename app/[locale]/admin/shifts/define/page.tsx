// app/[locale]/admin/shifts/define/page.tsx
import { Metadata } from 'next'
import { db } from '@/db'
import { inArray, eq } from 'drizzle-orm'
import {
	operatingHours,
	shiftRecurrences,
	weeklyShifts,
} from '@/db/schema/tables/shifts'
import { ShiftDefinitionsManager } from '@/components/admin/shift/ShiftDefinitions'
import { Shift } from '@/types/shifts'

type PageProps = {
	params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
	title: 'Manage Shift Definitions',
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

export default async function ManageShiftsPage({ params }: PageProps) {
	const { locale } = await params
	// 1) Get active operating days (only show those)
	const operating = await db
		.select({
			weekday: operatingHours.weekday,
			isClosed: operatingHours.isClosed,
			opensAt: operatingHours.opensAt,
			closesAt: operatingHours.closesAt,
		})
		.from(operatingHours)
		.where(eq(operatingHours.isClosed, false))

	const activeDays = operating
		.map((d) => ({
			weekday: d.weekday,
			label: WEEKDAY_LABELS[d.weekday],
			opensAt: d.opensAt,
			closesAt: d.closesAt,
		}))
		.sort((a, b) => a.weekday - b.weekday)

	const activeWeekdayNumbers = activeDays.map((d) => d.weekday)

	if (activeWeekdayNumbers.length === 0) {
		return (
			<div className="p-6 space-y-2">
				<h1 className="text-2xl font-semibold">Shift Definitions</h1>
				<p className="text-muted-foreground">
					No active operating days are configured. Set up operating hours first
					before defining shifts.
				</p>
			</div>
		)
	}

	// 2) Load existing weekly shifts for those days
	// const shifts = await db
	// 	.select({
	// 		id: weeklyShifts.id,
	// 		weekday: weeklyShifts.weekday,
	// 		startTime: weeklyShifts.startTime,
	// 		endTime: weeklyShifts.endTime,
	// 		isActive: weeklyShifts.isActive,
	// 		notes: weeklyShifts.notes,
	// 	})
	// 	.from(weeklyShifts)
	// 	.where(inArray(weeklyShifts.weekday, activeWeekdayNumbers))

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
		.where(inArray(weeklyShifts.weekday, activeWeekdayNumbers))

	const shiftMap = new Map<string, Shift>()

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
			shiftMap.get(r.shiftId)!.recurrences.push({
				id: r.recurrenceId,
				label: r.label!,
				weekOfMonth: r.weekOfMonth,
				isActive: r.recurrenceActive!,
				sortOrder: r.sortOrder!,
			})
		}
	}

	const shifts = Array.from(shiftMap.values())

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Shift Definitions</h1>
				<p className="text-sm text-muted-foreground">
					Admins and Directors can define the standard weekly shifts (day + time
					blocks) that others can assign people to.
				</p>
			</div>

			<ShiftDefinitionsManager days={activeDays} shifts={shifts} />
		</div>
	)
}
