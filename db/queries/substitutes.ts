// db/queries/substitutes.ts
import { db, kioskPeople, user } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { CalendarRequest } from '@/types/substitutes'
import { eq, and, sql, or } from 'drizzle-orm'

export async function getMyNominatedRequests(
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
			requestedByName: kioskPeople.fullName,
			requestedByImageUrl: kioskPeople.profileImageUrl,
		})
		.from(shiftSubRequests)
		.leftJoin(
			kioskPeople,
			eq(kioskPeople.userId, shiftSubRequests.requestedByUserId)
		)
		.where(
			and(
				eq(shiftSubRequests.status, 'awaiting_nomination_confirmation'),
				eq(shiftSubRequests.nominatedSubUserId, userId)
			)
		)

	// 🔒 Explicit narrowing (THIS IS THE KEY)
	return rows.map((r) => ({
		id: r.id,
		date: r.date,
		startTime: r.startTime,
		endTime: r.endTime,
		type: r.type === 'trade' ? 'trade' : 'substitute',
		hasVolunteeredByMe: false,
		requestedBy: {
			userId: r.requestedByUserId,
			name: r.requestedByName ?? 'Unknown',
			imageUrl: r.requestedByImageUrl ?? null,
		},
	}))
}

export async function getAcceptedSubstituteRequests(
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
				COALESCE(${kioskPeople.fullName}, ${user.name}, 'Unknown user')
			`,
			requestedByImageUrl: sql<string | null>`
				COALESCE(${kioskPeople.profileImageUrl}, ${user.image})
			`,
		})
		.from(shiftSubRequests)
		.leftJoin(user, eq(user.id, shiftSubRequests.requestedByUserId))
		.leftJoin(
			kioskPeople,
			eq(kioskPeople.userId, shiftSubRequests.requestedByUserId)
		)
		.where(
			and(
				eq(shiftSubRequests.status, 'accepted'),
				or(
					eq(shiftSubRequests.acceptedByUserId, userId),
					eq(shiftSubRequests.requestedByUserId, userId)
				)
			)
		)

	return rows.map((r) => ({
		id: r.id,
		date: r.date,
		startTime: r.startTime,
		endTime: r.endTime,
		type: r.type === 'trade' ? 'trade' : 'substitute',

		// ✅ required by CalendarRequest
		hasVolunteeredByMe: false,

		requestedBy: {
			userId: r.requestedByUserId,
			name: r.requestedByName ?? 'Unknown',
			imageUrl: r.requestedByImageUrl ?? null,
		},
	}))
}
