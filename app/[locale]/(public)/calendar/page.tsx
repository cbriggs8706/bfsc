// app/[locale]/(public)/calendar/page.tsx
import CenterCalendar from '@/components/custom/CenterCalendar'
import { db, operatingHours, specialHours } from '@/db'
import { toLocalYMD, ymdInTz } from '@/utils/time'
import { and, gte, lte } from 'drizzle-orm'
import { listCalendarEvents } from '@/db/queries/calendar-classes'
import { getTranslations } from 'next-intl/server'
import { getCenterTimeConfig } from '@/lib/time/center-time'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params

	const t = await getTranslations({ locale, namespace: 'common' })
	const centerTime = await getCenterTimeConfig()

	const [year, month] = ymdInTz(new Date(), centerTime.timeZone)
		.split('-')
		.map(Number)

	// Load a wider range so month navigation works without refetching
	const rangeStart = new Date(year, month - 1 - 3, 1)
	const rangeEnd = new Date(year, month - 1 + 4, 0)

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

	const classes = await listCalendarEvents(
		rangeStart,
		rangeEnd,
		centerTime.timeZone
	)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('bfscCalendar')}</h1>
				<p className="text-sm text-muted-foreground">
					Normal Operating Hours and Class Schedule
				</p>
			</div>

			<CenterCalendar
				specials={specials}
				weekly={weekly}
				classes={classes}
				centerTime={centerTime}
				initialYear={year}
				initialMonth={month - 1}
				locale={locale}
			/>
		</div>
	)
}
