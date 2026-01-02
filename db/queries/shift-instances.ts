// db/queries/shift-instances.ts
import { addMonths } from 'date-fns'
import { eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db, kioskPeople } from '@/db'
import { operatingHours, specialHours } from '@/db/schema/tables/shifts'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { user } from '@/db/schema/tables/auth'

import { generateShiftInstances } from '@/lib/shifts/generate-shift-instances'

import type { ShiftInstance } from '@/types/shifts'
import type { RequestDetail } from '@/types/substitutes'
import { weekdayFromYmd } from '@/utils/time'

//CORRECTED TIMEZONES

/* ======================================================
 * Types
 * ==================================================== */

export type ShiftInstanceWithRequest = ShiftInstance & {
	subRequest?: RequestDetail | null
}

/**
 * Raw DB shape (what Drizzle actually returns)
 */
type SubRequestRow = {
	id: string
	date: string
	startTime: string
	endTime: string
	type: string
	status: string

	requestedByUserId: string
	requestedByName: string
	requestedByImageUrl: string | null

	nominatedSubUserId: string | null

	acceptedByUserId: string | null
	acceptedByName: string | null
	acceptedByImageUrl: string | null

	shiftId: string
	shiftRecurrenceId: string | null
}

/* ======================================================
 * Mappers
 * ==================================================== */

function mapSubRequestRow(row: SubRequestRow): RequestDetail {
	return {
		id: row.id,
		date: row.date,
		startTime: row.startTime,
		endTime: row.endTime,
		type: row.type as 'substitute' | 'trade',
		status: row.status as RequestDetail['status'],

		requestedBy: {
			userId: row.requestedByUserId,
			name: row.requestedByName,
			imageUrl: row.requestedByImageUrl,
		},

		nominatedSubUserId: row.nominatedSubUserId,

		acceptedBy: row.acceptedByUserId
			? {
					userId: row.acceptedByUserId,
					name: row.acceptedByName ?? 'Unknown user',
					imageUrl: row.acceptedByImageUrl,
			  }
			: null,

		shiftId: row.shiftId,
		shiftRecurrenceId: row.shiftRecurrenceId,
	}
}

/* ======================================================
 * Query
 * ==================================================== */

export async function getUpcomingShiftInstances(
	currentUserId: string
): Promise<ShiftInstanceWithRequest[]> {
	/* --------------------------------------------------
	 * 1️⃣ Generate upcoming shift instances
	 * -------------------------------------------------- */

	const generated = await generateShiftInstances({
		start: new Date(),
		end: addMonths(new Date(), 4),
	})

	if (generated.length === 0) return []

	/* --------------------------------------------------
	 * 2️⃣ Load closure rules
	 * -------------------------------------------------- */

	const weeklyClosures = await db
		.select({ weekday: operatingHours.weekday })
		.from(operatingHours)
		.where(eq(operatingHours.isClosed, true))

	const closedWeekdays = new Set(weeklyClosures.map((w) => w.weekday))

	const specialClosures = await db
		.select({ date: specialHours.date })
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))

	const closedDates = new Set(specialClosures.map((s) => s.date))

	/* --------------------------------------------------
	 * 3️⃣ Filter out closed shifts
	 * -------------------------------------------------- */

	const openShifts = generated.filter((shift) => {
		const weekday = weekdayFromYmd(shift.date)

		if (closedWeekdays.has(weekday)) return false
		if (closedDates.has(shift.date)) return false

		return true
	})

	if (openShifts.length === 0) return []

	/* --------------------------------------------------
	 * 4️⃣ Load substitute requests (RAW)
	 * -------------------------------------------------- */

	const requesterUser = alias(user, 'requester_user')
	const requesterKiosk = alias(kioskPeople, 'requester_kiosk')

	const accepterUser = alias(user, 'accepter_user')
	const accepterKiosk = alias(kioskPeople, 'accepter_kiosk')

	const rawRequests: SubRequestRow[] = await db
		.select({
			id: shiftSubRequests.id,
			date: shiftSubRequests.date,
			startTime: shiftSubRequests.startTime,
			endTime: shiftSubRequests.endTime,
			type: shiftSubRequests.type,
			status: shiftSubRequests.status,

			requestedByUserId: shiftSubRequests.requestedByUserId,
			requestedByName: sql<string>`
			COALESCE(${requesterKiosk.fullName}, ${requesterUser.name}, 'Unknown user')
		`,
			requestedByImageUrl: sql<string | null>`
			COALESCE(${requesterKiosk.profileImageUrl}, ${requesterUser.image})
		`,

			nominatedSubUserId: shiftSubRequests.nominatedSubUserId,

			acceptedByUserId: shiftSubRequests.acceptedByUserId,
			acceptedByName: sql<string | null>`
			COALESCE(${accepterKiosk.fullName}, ${accepterUser.name})
		`,
			acceptedByImageUrl: sql<string | null>`
			COALESCE(${accepterKiosk.profileImageUrl}, ${accepterUser.image})
		`,

			shiftId: shiftSubRequests.shiftId,
			shiftRecurrenceId: shiftSubRequests.shiftRecurrenceId,
		})
		.from(shiftSubRequests)
		.leftJoin(
			requesterUser,
			eq(shiftSubRequests.requestedByUserId, requesterUser.id)
		)
		.leftJoin(
			requesterKiosk,
			eq(shiftSubRequests.requestedByUserId, requesterKiosk.userId)
		)
		.leftJoin(
			accepterUser,
			eq(shiftSubRequests.acceptedByUserId, accepterUser.id)
		)
		.leftJoin(
			accepterKiosk,
			eq(shiftSubRequests.acceptedByUserId, accepterKiosk.userId)
		)

	const requests = rawRequests.map(mapSubRequestRow)

	/* --------------------------------------------------
	 * 5️⃣ Attach request to shift instance
	 * -------------------------------------------------- */

	return openShifts.map((shift) => ({
		...shift,
		subRequest:
			requests.find(
				(r) => r.shiftId === shift.shiftId && r.date === shift.date
			) ?? null,
	}))
}
