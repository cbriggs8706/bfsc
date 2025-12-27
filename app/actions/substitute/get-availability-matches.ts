// app/actions/substitute/get-availability-matches.ts

'use server'

import { db } from '@/db'
import { eq, inArray } from 'drizzle-orm'
import { user } from '@/db/schema/tables/auth'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import {
	shiftSubRequests,
	workerShiftAvailability,
} from '@/db/schema/tables/substitutes'

type AvailabilityLevel = 'usually' | 'maybe'
type AvailabilitySpecificity = 'exact' | 'shiftOnly' | 'none'

export type AvailabilityMatch = {
	userId: string
	fullName: string
	email: string | null
	phone: string | null

	level: AvailabilityLevel | null
	specificity: AvailabilitySpecificity
	score: number
}

type AvailabilityRow = {
	userId: string
	level: AvailabilityLevel
	shiftRecurrenceId: string | null
}

function computeScore(
	level: AvailabilityLevel | null,
	specificity: AvailabilitySpecificity
): number {
	if (!level || specificity === 'none') return 0

	if (specificity === 'exact') {
		return level === 'usually' ? 100 : 60
	}

	// shiftOnly
	return level === 'usually' ? 80 : 40
}

export async function getAvailabilityMatches(
	requestId: string
): Promise<AvailabilityMatch[]> {
	const request = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
	})

	if (!request) throw new Error('Request not found')

	// 1) All workers (from kiosk_people cache)
	const workers = await db
		.select({
			userId: kioskPeople.userId,
			fullName: kioskPeople.fullName,
			kioskEmail: kioskPeople.email,
			phone: kioskPeople.phone,
		})
		.from(kioskPeople)
		.where(eq(kioskPeople.isWorkerCached, true))

	const filteredWorkers = workers.filter(
		(c): c is typeof c & { userId: string } =>
			typeof c.userId === 'string' && c.userId !== request.requestedByUserId
	)

	const workerUserIds = filteredWorkers
		.map((c) => c.userId)
		.filter((id): id is string => typeof id === 'string')

	if (workerUserIds.length === 0) return []

	// 2) User emails as fallback (if kiosk email missing)
	const userEmails = await db
		.select({
			id: user.id,
			email: user.email,
		})
		.from(user)
		.where(inArray(user.id, workerUserIds))

	const emailByUserId = new Map<string, string>()
	for (const u of userEmails) emailByUserId.set(u.id, u.email)

	// 3) Availability rows for this shift + recurrence (or shift-only)
	const availability = await db
		.select({
			userId: workerShiftAvailability.userId,
			level: workerShiftAvailability.level,
			shiftRecurrenceId: workerShiftAvailability.shiftRecurrenceId,
		})
		.from(workerShiftAvailability)
		.where(eq(workerShiftAvailability.shiftId, request.shiftId))

	const availabilityByUserId = new Map<string, AvailabilityRow[]>()
	for (const a of availability) {
		if (!workerUserIds.includes(a.userId)) continue
		const list = availabilityByUserId.get(a.userId) ?? []
		list.push({
			userId: a.userId,
			level: a.level as AvailabilityLevel,
			shiftRecurrenceId: a.shiftRecurrenceId,
		})
		availabilityByUserId.set(a.userId, list)
	}

	// 4) Compute best match per worker
	const results: AvailabilityMatch[] = workers
		.filter(
			(c): c is typeof c & { userId: string } => typeof c.userId === 'string'
		)
		.map((c) => {
			const rows = availabilityByUserId.get(c.userId) ?? []

			const exact =
				rows.find((r) => r.shiftRecurrenceId === request.shiftRecurrenceId) ??
				null
			const shiftOnly = rows.find((r) => r.shiftRecurrenceId === null) ?? null

			let level: AvailabilityLevel | null = null
			let specificity: AvailabilitySpecificity = 'none'

			if (exact) {
				level = exact.level
				specificity = 'exact'
			} else if (shiftOnly) {
				level = shiftOnly.level
				specificity = 'shiftOnly'
			}

			const score = computeScore(level, specificity)

			const email = c.kioskEmail ?? emailByUserId.get(c.userId) ?? null

			return {
				userId: c.userId,
				fullName: c.fullName,
				email,
				phone: c.phone ?? null,
				level,
				specificity,
				score,
			}
		})

	// 5) Sort best-first
	results.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score
		return a.fullName.localeCompare(b.fullName)
	})

	return results
}
