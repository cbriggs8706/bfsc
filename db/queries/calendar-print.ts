import 'server-only'

import { fromZonedTime } from 'date-fns-tz'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'

import { db } from '@/db'
import {
	classSeries,
	classSeriesPresenter,
	classSession,
} from '@/db/schema/tables/classes'
import { user } from '@/db/schema/tables/auth'
import { reservations, resources } from '@/db/schema/tables/resources'
import { specialHours } from '@/db/schema/tables/shifts'
import { ymdInTz } from '@/utils/time'

type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

export type PrintableClassEvent = {
	id: string
	date: string
	startsAtIso: string
	title: string
	location: string
	presenters: string[]
	isCanceled: boolean
}

export type PrintableReservationEvent = {
	id: string
	date: string
	startsAtIso: string
	endsAtIso: string
	resource: string
	name: string
	status: ReservationStatus
}

export type PrintableClosureEvent = {
	id: string
	date: string
	reason: string | null
}

type ListCalendarPrintDataArgs = {
	month: string // YYYY-MM
	centerTimeZone: string
	includeClasses: boolean
	includeReservations: boolean
	classPresenter: string | null
	classLocation: string | null
	reservationResource: string | null
	reservationStatuses: ReservationStatus[]
	canViewUnconfirmedReservations: boolean
}

export async function listCalendarPrintData({
	month,
	centerTimeZone,
	includeClasses,
	includeReservations,
	classPresenter,
	classLocation,
	reservationResource,
	reservationStatuses,
	canViewUnconfirmedReservations,
}: ListCalendarPrintDataArgs): Promise<{
	classes: PrintableClassEvent[]
	reservations: PrintableReservationEvent[]
	closures: PrintableClosureEvent[]
}> {
	const monthMatch = month.match(/^(\d{4})-(\d{2})$/)
	if (!monthMatch) {
		return { classes: [], reservations: [], closures: [] }
	}

	const year = Number(monthMatch[1])
	const monthNumber = Number(monthMatch[2])

	const rangeStartUtc = fromZonedTime(
		new Date(year, monthNumber - 1, 1, 0, 0, 0, 0),
		centerTimeZone
	)
	const rangeEndUtc = fromZonedTime(
		new Date(year, monthNumber, 0, 23, 59, 59, 999),
		centerTimeZone
	)

	let printableClasses: PrintableClassEvent[] = []
	if (includeClasses) {
		const classRows = await db
			.select({
				sessionId: classSession.id,
				startsAt: classSession.startsAt,
				status: classSession.status,
				titleOverride: classSession.titleOverride,
				locationOverride: classSession.locationOverride,
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

		const classesBySession = new Map<string, PrintableClassEvent>()
		for (const row of classRows) {
			const existing = classesBySession.get(row.sessionId)
			if (!existing) {
				const start = new Date(row.startsAt)
				classesBySession.set(row.sessionId, {
					id: row.sessionId,
					date: ymdInTz(start, centerTimeZone),
					startsAtIso: start.toISOString(),
					title: row.titleOverride || row.seriesTitle,
					location: row.locationOverride || row.seriesLocation,
					presenters: row.presenterName ? [row.presenterName] : [],
					isCanceled: row.status === 'canceled',
				})
				continue
			}

			if (
				row.presenterName &&
				!existing.presenters.includes(row.presenterName)
			) {
				existing.presenters.push(row.presenterName)
			}
		}

		printableClasses = Array.from(classesBySession.values())
			.filter((event) =>
				classPresenter && classPresenter !== 'all'
					? event.presenters.includes(classPresenter)
					: true
			)
			.filter((event) =>
				classLocation && classLocation !== 'all'
					? event.location === classLocation
					: true
			)
			.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
	}

	let printableReservations: PrintableReservationEvent[] = []
	if (includeReservations) {
		const requestedStatuses =
			reservationStatuses.length > 0 ? reservationStatuses : ['confirmed']

		const permittedStatuses = canViewUnconfirmedReservations
			? requestedStatuses
			: (['confirmed'] as ReservationStatus[])

		const reservationRows = await db
			.select({
				id: reservations.id,
				startTime: reservations.startTime,
				endTime: reservations.endTime,
				status: reservations.status,
				resourceName: resources.name,
				userName: user.name,
				userEmail: user.email,
			})
			.from(reservations)
			.innerJoin(resources, eq(resources.id, reservations.resourceId))
			.innerJoin(user, eq(user.id, reservations.userId))
			.where(
				and(
					gte(reservations.startTime, rangeStartUtc),
					lte(reservations.startTime, rangeEndUtc),
					inArray(reservations.status, permittedStatuses)
				)
			)

		printableReservations = reservationRows
			.filter((event) =>
				reservationResource && reservationResource !== 'all'
					? event.resourceName === reservationResource
					: true
			)
			.map((event) => {
				const start = new Date(event.startTime)
				return {
					id: event.id,
					date: ymdInTz(start, centerTimeZone),
					startsAtIso: start.toISOString(),
					endsAtIso: new Date(event.endTime).toISOString(),
					resource: event.resourceName,
					name: event.userName || event.userEmail || 'Unknown',
					status: event.status as ReservationStatus,
				}
			})
			.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
	}

	const closureRows = await db
		.select({
			id: specialHours.id,
			date: specialHours.date,
			reason: specialHours.reason,
		})
		.from(specialHours)
		.where(
			and(
				eq(specialHours.isClosed, true),
				gte(specialHours.date, `${month}-01`),
				lte(specialHours.date, `${month}-31`)
			)
		)

	const printableClosures: PrintableClosureEvent[] = closureRows.sort((a, b) =>
		a.date.localeCompare(b.date)
	)

	return {
		classes: printableClasses,
		reservations: printableReservations,
		closures: printableClosures,
	}
}
