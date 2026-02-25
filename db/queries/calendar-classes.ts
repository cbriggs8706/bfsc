// db/queries/calendar-classes.ts
import 'server-only'
import { db } from '@/db'
import { and, gte, lte, eq, inArray } from 'drizzle-orm'
import { fromZonedTime } from 'date-fns-tz'

import {
	classSeries,
	classSession,
	classSeriesPresenter,
} from '@/db/schema/tables/classes'
import { user } from '@/db/schema/tables/auth'
import { reservations, resources } from '@/db/schema/tables/resources'
import { ymdInTz } from '@/utils/time'
import { getConfirmedEventsForCalendar } from './group-scheduling'

type ClassCalendarEvent = {
	id: string
	date: string // yyyy-mm-dd LOCAL
	startsAtIso: string
	title: string
	location: string
	description: string | null
	descriptionOverride: string | null
	isCanceled: boolean
	presenters: string[]
	kind: 'class'
}

type ReservationCalendarEvent = {
	id: string
	date: string // yyyy-mm-dd LOCAL
	startsAtIso: string
	title: string
	location: string
	description: string | null
	descriptionOverride: string | null
	isCanceled: boolean
	presenters: string[]
	kind: 'reservation'
	reservationStatus: 'pending' | 'confirmed'
}

type GroupVisitCalendarEvent = {
	id: string
	date: string
	startsAtIso: string
	title: string
	location: string
	description: string | null
	descriptionOverride: string | null
	isCanceled: boolean
	presenters: string[]
	kind: 'group-visit'
}

export type CalendarEvent =
	| ClassCalendarEvent
	| ReservationCalendarEvent
	| GroupVisitCalendarEvent

export async function listCalendarEvents(
	rangeStart: Date,
	rangeEnd: Date,
	centerTimeZone: string
): Promise<CalendarEvent[]> {
	const startYmd = ymdInTz(rangeStart, centerTimeZone)
	const endYmd = ymdInTz(rangeEnd, centerTimeZone)

	const [startYear, startMonth, startDay] = startYmd.split('-').map(Number)
	const [endYear, endMonth, endDay] = endYmd.split('-').map(Number)

	const rangeStartUtc = fromZonedTime(
		new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0),
		centerTimeZone
	)
	const rangeEndUtc = fromZonedTime(
		new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999),
		centerTimeZone
	)

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
				gte(classSession.startsAt, rangeStartUtc),
				lte(classSession.startsAt, rangeEndUtc)
			)
		)

	// --- Aggregate presenters per session ---
	const bySession = new Map<string, ClassCalendarEvent>()

	for (const r of rows) {
		let entry = bySession.get(r.sessionId)

		if (!entry) {
			const dt = new Date(r.startsAt)
			const ymdCenter = ymdInTz(dt, centerTimeZone)

			entry = {
				id: r.sessionId,
				date: ymdCenter,
				startsAtIso: dt.toISOString(),
				title: r.titleOverride || r.seriesTitle,
				description: r.description || null,
				descriptionOverride: r.descriptionOverride || null,
				location: r.locationOverride || r.seriesLocation,
				isCanceled: r.status === 'canceled',
				presenters: [],
				kind: 'class',
			}

			bySession.set(r.sessionId, entry)
		}

		if (r.presenterName && !entry.presenters.includes(r.presenterName)) {
			entry.presenters.push(r.presenterName)
		}
	}

	const [reservationRows, groupVisitRows] = await Promise.all([
		db
		.select({
			id: reservations.id,
			startTime: reservations.startTime,
			resourceName: resources.name,
			status: reservations.status,
		})
		.from(reservations)
		.innerJoin(resources, eq(reservations.resourceId, resources.id))
		.where(
			and(
				gte(reservations.startTime, rangeStartUtc),
				lte(reservations.startTime, rangeEndUtc),
				inArray(reservations.status, ['pending', 'confirmed'])
			)
		),
		getConfirmedEventsForCalendar(rangeStartUtc, rangeEndUtc),
	])

	const reservationEvents: ReservationCalendarEvent[] = reservationRows.map(
		(r) => {
			const dt = new Date(r.startTime)
			return {
				id: `reservation:${r.id}`,
				date: ymdInTz(dt, centerTimeZone),
				startsAtIso: dt.toISOString(),
				// Pending reservations intentionally avoid patron identity.
				title: `Reserved: ${r.resourceName}`,
				location: r.resourceName,
				description: null,
				descriptionOverride: null,
				isCanceled: false,
				presenters: [],
				kind: 'reservation',
				reservationStatus: r.status as 'pending' | 'confirmed',
			}
		}
	)

	const groupVisitEvents: GroupVisitCalendarEvent[] = groupVisitRows.map((r) => {
		const dt = new Date(r.startsAt)
		const scope = r.wardName ? `${r.stakeName} - ${r.wardName}` : r.stakeName
		return {
			id: `group-visit:${r.id}`,
			date: ymdInTz(dt, centerTimeZone),
			startsAtIso: dt.toISOString(),
			title: r.title,
			location: 'FamilySearch Center',
			description: scope,
			descriptionOverride: null,
			isCanceled: false,
			presenters: [],
			kind: 'group-visit',
		}
	})

	return [
		...Array.from(bySession.values()),
		...reservationEvents,
		...groupVisitEvents,
	].sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
}
