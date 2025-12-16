// app/[locale]/(public)/calendar/page.tsx
import CenterCalendar from '@/components/custom/CenterCalendar'
import { db, operatingHours, specialHours } from '@/db'
import { toLocalYMD } from '@/utils/time'
import { and, gte, lte } from 'drizzle-orm'
import { listCalendarClasses } from '@/db/queries/calendar-classes'

export default async function Page() {
	const today = new Date()
	const year = today.getFullYear()
	const month = today.getMonth()

	// Load a wider range so month navigation works without refetching
	const rangeStart = new Date(year, month - 3, 1)
	const rangeEnd = new Date(year, month + 4, 0)

	const firstStr = toLocalYMD(rangeStart)
	const lastStr = toLocalYMD(rangeEnd)

	const specialsRaw = await db
		.select()
		.from(specialHours)
		.where(
			and(gte(specialHours.date, firstStr), lte(specialHours.date, lastStr))
		)

	const specials = specialsRaw.map((s) => ({
		id: s.id,
		date: s.date,
		isClosed: s.isClosed,
		opensAt: s.opensAt,
		closesAt: s.closesAt,
		reason: s.reason,
	}))

	const weeklyRaw = await db.select().from(operatingHours)
	const weekly = weeklyRaw.map((w) => ({
		weekday: w.weekday,
		opensAt: w.opensAt,
		closesAt: w.closesAt,
		isClosed: w.isClosed,
	}))

	const classes = await listCalendarClasses(rangeStart, rangeEnd)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">BFSC Calendar</h1>
				<p className="text-sm text-muted-foreground">
					Normal Operating Hours and Class Schedule
				</p>
			</div>

			<CenterCalendar
				specials={specials}
				weekly={weekly}
				classes={classes}
				initialYear={year}
				initialMonth={month}
			/>
		</div>
	)
}
