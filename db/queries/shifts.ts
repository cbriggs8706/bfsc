// db queries/shifts.ts
import { db, kioskPeople, user } from '@/db'
import { weeklyShifts, shiftRecurrences, shiftAssignments } from '@/db'
import {
	consultantShiftAvailability,
	shiftSubRequests,
	shiftSubVolunteers,
} from '@/db'
import { and, eq, sql } from 'drizzle-orm'
import type {
	AvailabilityMatch,
	AvailabilityValue,
	CalendarRequest,
	RequestDetail,
	Volunteer,
} from '@/types/substitutes'
import { getAvailabilityMatchesForRequest } from './get-availability-matches'
import { alias } from 'drizzle-orm/pg-core'
import { OnShiftConsultant } from '@/types/kiosk'
import { CertificateSummary } from '@/types/training'

export async function getAvailabilityData(userId: string) {
	// 1️⃣ Load shifts
	const shifts = await db
		.select({
			id: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
		})
		.from(weeklyShifts)

	// 2️⃣ Load recurrences
	const recurrences = await db
		.select({
			id: shiftRecurrences.id,
			shiftId: shiftRecurrences.shiftId,
			label: shiftRecurrences.label,
		})
		.from(shiftRecurrences)

	// 3️⃣ Load availability (raw)
	const availabilityRaw = await db
		.select({
			shiftId: consultantShiftAvailability.shiftId,
			shiftRecurrenceId: consultantShiftAvailability.shiftRecurrenceId,
			level: consultantShiftAvailability.level,
		})
		.from(consultantShiftAvailability)
		.where(eq(consultantShiftAvailability.userId, userId))

	// 4️⃣ Narrow DB strings → strict client union
	const availability = availabilityRaw.map((a) => {
		const level: AvailabilityValue =
			a.level === 'usually' || a.level === 'maybe' ? a.level : null

		return {
			shiftId: a.shiftId,
			shiftRecurrenceId: a.shiftRecurrenceId,
			level,
		}
	})

	return {
		shifts,
		recurrences,
		availability,
	}
}

export async function getOpenSubstituteRequests(
	userId: string
): Promise<CalendarRequest[]> {
	const rows = await db
		.select({
			id: shiftSubRequests.id,
			date: shiftSubRequests.date,
			startTime: shiftSubRequests.startTime,
			endTime: shiftSubRequests.endTime,
			type: shiftSubRequests.type,

			requestedByUserId: shiftSubRequests.requestedByUserId,
			requestedByName: sql<string>`
		COALESCE(${requesterKiosk.fullName}, ${requesterUser.name}, 'Unknown')
	`,
			requestedByImageUrl: sql<string | null>`
		COALESCE(${requesterKiosk.profileImageUrl}, ${requesterUser.image})
	`,

			// ✅ ADD THIS
			hasVolunteeredByMe: sql<boolean>`
		EXISTS (
			SELECT 1
			FROM ${shiftSubVolunteers} v
			WHERE
				v.request_id = ${shiftSubRequests.id}
				AND v.volunteer_user_id = ${userId}
				AND v.status = 'offered'
		)
	`.as('hasVolunteeredByMe'),
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
		.where(
			sql`${shiftSubRequests.status} IN ('open','awaiting_request_confirmation')`
		)

	return rows.map((r) => ({
		id: r.id,
		date: r.date,
		startTime: r.startTime,
		endTime: r.endTime,
		type: r.type === 'trade' ? 'trade' : 'substitute',

		requestedBy: {
			userId: r.requestedByUserId,
			name: r.requestedByName ?? 'Unknown',
			imageUrl: r.requestedByImageUrl ?? null,
		},

		// ✅ ADD THIS
		hasVolunteeredByMe: r.hasVolunteeredByMe,
	}))
}

const requesterUser = alias(user, 'requester_user')
const requesterKiosk = alias(kioskPeople, 'requester_kiosk')

const accepterUser = alias(user, 'accepter_user')
const accepterKiosk = alias(kioskPeople, 'accepter_kiosk')

export async function getSubstituteRequestDetail(requestId: string): Promise<{
	request: RequestDetail
	volunteers: Volunteer[]
	availabilityMatches: AvailabilityMatch[]
}> {
	/* -----------------------------
	 * Request
	 * --------------------------- */

	const r = await db
		.select({
			id: shiftSubRequests.id,
			shiftId: shiftSubRequests.shiftId,
			shiftRecurrenceId: shiftSubRequests.shiftRecurrenceId,
			date: shiftSubRequests.date,
			startTime: shiftSubRequests.startTime,
			endTime: shiftSubRequests.endTime,
			type: shiftSubRequests.type,
			status: shiftSubRequests.status,
			nominatedSubUserId: shiftSubRequests.nominatedSubUserId,

			requestedByUserId: shiftSubRequests.requestedByUserId,
			requestedByName: sql<string>`COALESCE(${requesterKiosk.fullName}, ${requesterUser.name})`,
			requestedByImageUrl: sql<string | null>`
			COALESCE(${requesterKiosk.profileImageUrl}, ${requesterUser.image})
		`,

			acceptedByUserId: shiftSubRequests.acceptedByUserId,
			acceptedByName: sql<
				string | null
			>`COALESCE(${accepterKiosk.fullName}, ${accepterUser.name})`,
			acceptedByImageUrl: sql<string | null>`
			COALESCE(${accepterKiosk.profileImageUrl}, ${accepterUser.image})
		`,
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
		.where(eq(shiftSubRequests.id, requestId))
		.then((rows) => rows[0])

	if (!r) {
		throw new Error('Request not found')
	}

	const request: RequestDetail = {
		id: r.id,
		date: r.date,
		startTime: r.startTime,
		endTime: r.endTime,
		type: r.type === 'trade' ? 'trade' : 'substitute',
		status: (() => {
			switch (r.status) {
				case 'open':
				case 'awaiting_request_confirmation':
				case 'awaiting_nomination_confirmation':
				case 'accepted':
				case 'cancelled':
				case 'expired':
					return r.status
				default:
					throw new Error(`Invalid request status: ${r.status}`)
			}
		})(),

		requestedBy: {
			userId: r.requestedByUserId,
			name: r.requestedByName ?? 'Unknown',
			imageUrl: r.requestedByImageUrl ?? null,
		},

		acceptedBy: r.acceptedByUserId
			? {
					userId: r.acceptedByUserId,
					name: r.acceptedByName ?? 'Unknown',
					imageUrl: r.acceptedByImageUrl ?? null,
			  }
			: null,
		nominatedSubUserId: r.nominatedSubUserId,
		shiftId: r.shiftId,
		shiftRecurrenceId: r.shiftRecurrenceId,
	}

	/* -----------------------------
	 * Volunteers
	 * --------------------------- */

	const volunteersRaw = await db
		.select({
			userId: shiftSubVolunteers.volunteerUserId,
			status: shiftSubVolunteers.status,
			fullName: kioskPeople.fullName,
			imageUrl: kioskPeople.profileImageUrl,
		})
		.from(shiftSubVolunteers)
		.leftJoin(
			kioskPeople,
			eq(kioskPeople.userId, shiftSubVolunteers.volunteerUserId)
		)
		.where(eq(shiftSubVolunteers.requestId, requestId))

	const volunteers: Volunteer[] = volunteersRaw.map((v) => ({
		userId: v.userId,
		fullName: v.fullName ?? 'Unknown',
		imageUrl: v.imageUrl ?? null,
		status: v.status === 'withdrawn' ? 'withdrawn' : 'offered',
	}))

	const allConsultants = await getAllConsultants()
	const availabilityMatches = await getAvailabilityMatchesForRequest(requestId)

	// Build lookup table
	const matchMap = new Map(
		availabilityMatches.map((m) => [m.user.userId, m.matchLevel])
	)

	const consultants: AvailabilityMatch[] = allConsultants
		.filter((c) => c.userId !== request.requestedBy.userId) // exclude requester
		.map(
			(c): AvailabilityMatch => ({
				user: {
					userId: c.userId,
					name: c.name,
					imageUrl: c.imageUrl,
				},
				matchLevel: matchMap.get(c.userId) ?? 'none',
			})
		)

		.sort((a, b) => {
			// 1️⃣ Availability rank
			const rank = (m: AvailabilityMatch['matchLevel']) =>
				m === 'usually' ? 0 : m === 'maybe' ? 1 : 2

			const rankDiff = rank(a.matchLevel) - rank(b.matchLevel)
			if (rankDiff !== 0) return rankDiff

			// 2️⃣ Alphabetical by name (locale-aware)
			return a.user.name.localeCompare(b.user.name, undefined, {
				sensitivity: 'base',
			})
		})

	return {
		request,
		volunteers,
		availabilityMatches: consultants,
	}
}

export async function getShiftForRequestCreation(input: {
	shiftRecurrenceId: string
	date: string
	userId: string
}) {
	const { shiftRecurrenceId, userId } = input

	const result = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			recurrenceLabel: shiftRecurrences.label,
		})
		.from(shiftRecurrences)
		.innerJoin(weeklyShifts, eq(weeklyShifts.id, shiftRecurrences.shiftId))
		.innerJoin(
			shiftAssignments,
			and(
				eq(shiftAssignments.shiftRecurrenceId, shiftRecurrences.id),
				eq(shiftAssignments.userId, userId)
			)
		)
		.where(eq(shiftRecurrences.id, shiftRecurrenceId))
		.then((rows) => rows[0])

	return result ?? null
}

export async function findExistingSubRequest(input: {
	shiftRecurrenceId: string
	date: string
	requestedByUserId: string
}) {
	return db
		.select({
			id: shiftSubRequests.id,
			status: shiftSubRequests.status,
		})
		.from(shiftSubRequests)
		.where(
			and(
				eq(shiftSubRequests.shiftRecurrenceId, input.shiftRecurrenceId),
				eq(shiftSubRequests.date, input.date),
				eq(shiftSubRequests.requestedByUserId, input.requestedByUserId),
				sql`${shiftSubRequests.status} NOT IN ('cancelled','expired')`
			)
		)
		.then((rows) => rows[0] ?? null)
}

export async function getAllConsultants(): Promise<
	{ userId: string; name: string; imageUrl: string | null }[]
> {
	const rows = await db
		.select({
			userId: user.id,
			name: sql<string>`COALESCE(${kioskPeople.fullName}, ${user.name})`,
			imageUrl: sql<string | null>`
				COALESCE(${kioskPeople.profileImageUrl}, ${user.image})
			`,
		})
		.from(user)
		.leftJoin(kioskPeople, eq(kioskPeople.userId, user.id))
		.where(eq(user.role, 'Consultant'))

	return rows.map((r) => ({
		userId: r.userId,
		name: r.name ?? 'Unknown',
		imageUrl: r.imageUrl ?? null,
	}))
}
