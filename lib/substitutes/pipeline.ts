export type SubRequestStatus =
	| 'open'
	| 'awaiting_request_confirmation'
	| 'awaiting_nomination_confirmation'
	| 'accepted'
	| 'cancelled'
	| 'expired'

export type AvailabilityLevel = 'usually' | 'maybe'
export type AvailabilitySpecificity = 'exact' | 'shiftOnly' | 'none'

export function computeAvailabilityScore(
	level: AvailabilityLevel | null,
	specificity: AvailabilitySpecificity
): number {
	if (!level || specificity === 'none') return 0

	if (specificity === 'exact') {
		return level === 'usually' ? 100 : 60
	}

	return level === 'usually' ? 80 : 40
}

export function canReopenSubRequest(status: SubRequestStatus): boolean {
	return status === 'cancelled' || status === 'expired'
}

export function canCancelSubRequest(status: SubRequestStatus): boolean {
	return status !== 'accepted' && status !== 'cancelled' && status !== 'expired'
}
