// db/queries/calendar-classes.ts
import 'server-only'
import { db } from '@/db'
import { and, gte, lte, eq } from 'drizzle-orm'
import { format } from 'date-fns'

import {
	classSeries,
	classSession,
	classSeriesPresenter,
} from '@/db/schema/tables/classes'
import { user } from '@/db/schema/tables/auth'

export type CalendarClass = {
	id: string
	date: string // yyyy-mm-dd LOCAL
	startsAtIso: string
	title: string
	location: string
	description: string | null
	descriptionOverride: string | null
	isCanceled: boolean
	presenters: string[]
}

export async function listCalendarClasses(
	rangeStart: Date,
	rangeEnd: Date
): Promise<CalendarClass[]> {
	const rows = await db
		.select({
			sessionId: classSession.id,
			startsAt: classSession.startsAt,
			status: classSession.status,
			titleOverride: classSession.titleOverride,
			locationOverride: classSession.locationOverride,
			description: classSeries.description,
			descriptionOverride: classSession.descriptionOverride,
			seriesTitle: classSeries.title,
			seriesLocation: classSeries.location,

			presenterName: user.name,
		})
		.from(classSession)
		.innerJoin(classSeries, eq(classSession.seriesId, classSeries.id))
		.leftJoin(
			classSeriesPresenter,
			eq(classSeriesPresenter.seriesId, classSeries.id)
		)
		.leftJoin(user, eq(user.id, classSeriesPresenter.userId))
		.where(
			and(
				eq(classSeries.status, 'published'),
				gte(classSession.startsAt, rangeStart),
				lte(classSession.startsAt, rangeEnd)
			)
		)

	// --- Aggregate presenters per session ---
	const bySession = new Map<string, CalendarClass>()

	for (const r of rows) {
		let entry = bySession.get(r.sessionId)

		if (!entry) {
			const dt = new Date(r.startsAt)
			const ymdLocal = format(dt, 'yyyy-MM-dd')

			entry = {
				id: r.sessionId,
				date: ymdLocal,
				startsAtIso: dt.toISOString(),
				title: r.titleOverride || r.seriesTitle,
				description: r.description || null,
				descriptionOverride: r.descriptionOverride || null,
				location: r.locationOverride || r.seriesLocation,
				isCanceled: r.status === 'canceled',
				presenters: [],
			}

			bySession.set(r.sessionId, entry)
		}

		if (r.presenterName && !entry.presenters.includes(r.presenterName)) {
			entry.presenters.push(r.presenterName)
		}
	}

	return Array.from(bySession.values())
}
