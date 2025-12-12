// app/[locale]/admin/shifts/page.tsx
import { Metadata } from 'next'
import { eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/db'
import {
	operatingHours,
	weeklyShifts,
	shiftAssignments,
} from '@/db/schema/tables/shifts'
import { user } from '@/db/schema/tables/auth'
import { ShiftScheduler } from '@/components/admin/shift/ShiftScheduler'

export const metadata: Metadata = {
	title: 'Shift Schedule',
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
	// 1) Active operating days (isClosed = false)
	const activeDays = await db
		.select({
			weekday: operatingHours.weekday,
			isClosed: operatingHours.isClosed,
		})
		.from(operatingHours)
		.where(eq(operatingHours.isClosed, false))

	const activeWeekdayNumbers = activeDays.map((d) => d.weekday)

	if (activeWeekdayNumbers.length === 0) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-semibold mb-2">Shift Schedule</h1>
				<p className="text-muted-foreground">
					No operating days are configured. Please set up operating hours first.
				</p>
			</div>
		)
	}

	// 2) Weekly shifts for only those days
	const shifts = await db
		.select({
			id: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			notes: weeklyShifts.notes,
			isActive: weeklyShifts.isActive,
		})
		.from(weeklyShifts)
		.where(inArray(weeklyShifts.weekday, activeWeekdayNumbers))

	// 3) Shift assignments w/ user info
	const assignments = await db
		.select({
			id: shiftAssignments.id,
			shiftId: shiftAssignments.shiftId,
			userId: shiftAssignments.userId,
			isPrimary: shiftAssignments.isPrimary,
			userName: user.name,
			userRole: user.role,
			userEmail: user.email,
		})
		.from(shiftAssignments)
		.innerJoin(user, eq(shiftAssignments.userId, user.id))

	// 4) List of assignable users (role !== 'Patron')
	const consultants = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.where(ne(user.role, 'Patron'))

	const days = activeWeekdayNumbers
		.sort((a, b) => a - b)
		.map((weekday) => ({
			weekday,
			label: WEEKDAY_LABELS[weekday],
		}))

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Shift Schedule</h1>
				<p className="text-sm text-muted-foreground">
					Drag people between shifts. Only active operating days are shown.
				</p>
			</div>

			<ShiftScheduler
				days={days}
				shifts={shifts}
				assignments={assignments}
				consultants={consultants}
			/>
		</div>
	)
}
