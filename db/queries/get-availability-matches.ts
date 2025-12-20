// db/queries/get-availability-matches.ts
import { db, kioskPeople, user } from '@/db'
import {
	consultantShiftAvailability,
	shiftSubRequests,
} from '@/db/schema/tables/substitutes'
import { eq, and, ne, isNull, or } from 'drizzle-orm'
import type { AvailabilityMatch } from '@/types/substitutes'

export async function getAvailabilityMatchesForRequest(
	requestId: string
): Promise<AvailabilityMatch[]> {
	/* ----------------------------------------
	 * 1️⃣ Load request context
	 * -------------------------------------- */

	const request = await db
		.select({
			shiftId: shiftSubRequests.shiftId,
			shiftRecurrenceId: shiftSubRequests.shiftRecurrenceId,
			requestedByUserId: shiftSubRequests.requestedByUserId,
		})
		.from(shiftSubRequests)
		.where(eq(shiftSubRequests.id, requestId))
		.then((rows) => rows[0])

	if (!request) return []

	/* ----------------------------------------
	 * 2️⃣ Query availability
	 * -------------------------------------- */

	const rows = await db
		.select({
			userId: user.id, // ✅ auth.users.id
			level: consultantShiftAvailability.level,
			name: kioskPeople.fullName,
			imageUrl: kioskPeople.profileImageUrl,
		})
		.from(consultantShiftAvailability)
		.innerJoin(
			user,
			eq(user.id, consultantShiftAvailability.userId) // ✅ ENFORCES auth user
		)
		.leftJoin(kioskPeople, eq(kioskPeople.userId, user.id))
		.where(
			and(
				eq(consultantShiftAvailability.shiftId, request.shiftId),
				ne(user.id, request.requestedByUserId),
				or(
					eq(
						consultantShiftAvailability.shiftRecurrenceId,
						request.shiftRecurrenceId
					),
					isNull(consultantShiftAvailability.shiftRecurrenceId)
				)
			)
		)

	/* ----------------------------------------
	 * 3️⃣ Narrow + map
	 * -------------------------------------- */

	return rows
		.filter(
			(r): r is typeof r & { level: 'usually' | 'maybe' } =>
				r.level === 'usually' || r.level === 'maybe'
		)
		.map((r) => ({
			user: {
				userId: r.userId,
				name: r.name ?? 'Unknown',
				imageUrl: r.imageUrl ?? null,
			},
			matchLevel: r.level,
		}))
		.sort((a, b) =>
			a.matchLevel === b.matchLevel ? 0 : a.matchLevel === 'usually' ? -1 : 1
		)
}
