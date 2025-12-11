import KioskCalendar from '@/components/custom/calendar'
import { db } from '@/db'
import {
	kioskOperatingHours,
	kioskSpecialHours,
} from '@/db/schema/tables/kiosk'
import { toLocalYMD } from '@/utils/time'
import { and, gte, lte } from 'drizzle-orm'

export default async function Page() {
	const today = new Date()
	const year = today.getFullYear()
	const month = today.getMonth()

	// Load specials for prev + current + next month
	const rangeStart = new Date(year, month - 1, 1)
	const rangeEnd = new Date(year, month + 2, 0)

	const firstStr = toLocalYMD(rangeStart)
	const lastStr = toLocalYMD(rangeEnd)

	const specialsRaw = await db
		.select()
		.from(kioskSpecialHours)
		.where(
			and(
				gte(kioskSpecialHours.date, firstStr),
				lte(kioskSpecialHours.date, lastStr)
			)
		)

	const specials = specialsRaw.map((s) => ({
		id: s.id,
		date: s.date,
		isClosed: s.isClosed,
		opensAt: s.opensAt,
		closesAt: s.closesAt,
		reason: s.reason,
	}))

	const weeklyRaw = await db.select().from(kioskOperatingHours)

	const weekly = weeklyRaw.map((w) => ({
		weekday: w.weekday,
		opensAt: w.opensAt,
		closesAt: w.closesAt,
		isClosed: w.isClosed,
	}))

	return (
		<KioskCalendar
			specials={specials}
			weekly={weekly}
			initialYear={year}
			initialMonth={month}
		/>
	)
}
