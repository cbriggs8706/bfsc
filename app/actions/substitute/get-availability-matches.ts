// app/actions/substitute/get-availability-matches.ts

'use server'

import { getAvailabilityMatchesForRequest } from '@/db/queries/get-availability-matches'
import { computeAvailabilityScore } from '@/lib/substitutes/pipeline'

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

// Canonical source is db/queries/get-availability-matches.ts.
// This action remains as a compatibility adapter for any callers.
export async function getAvailabilityMatches(
	requestId: string
): Promise<AvailabilityMatch[]> {
	const rows = await getAvailabilityMatchesForRequest(requestId)

	return rows
		.map((row) => {
			const level = row.matchLevel === 'none' ? null : row.matchLevel
			const specificity: AvailabilitySpecificity = level ? 'exact' : 'none'

			return {
				userId: row.user.userId,
				fullName: row.user.name,
				email: null,
				phone: null,
				level,
				specificity,
				score: computeAvailabilityScore(level, specificity),
			}
		})
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score
			return a.fullName.localeCompare(b.fullName)
		})
}
