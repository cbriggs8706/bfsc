import { UserSummary } from './user'

// types/substitutes.ts
export type RequestDetail = {
	id: string
	date: string
	startTime: string
	endTime: string
	type: 'substitute' | 'trade'
	status:
		| 'open'
		| 'awaiting_request_confirmation'
		| 'accepted'
		| 'cancelled'
		| 'expired'
		| 'awaiting_nomination_confirmation'

	requestedBy: UserSummary
	acceptedBy: UserSummary | null
	nominatedSubUserId: string | null

	shiftId: string
	shiftRecurrenceId: string | null
}

export type Volunteer = {
	userId: string
	fullName: string
	imageUrl?: string | null
	status: 'offered' | 'withdrawn'
}

export type TradeOptionDraft = {
	shiftId: string
	shiftRecurrenceId: string
	date: string
	startTime: string
	endTime: string
}

export type TradeOffer = {
	id: string
	offeredByName: string
	options: {
		id: string
		date: string
		startTime: string
		endTime: string
	}[]
}

export type AvailabilityValue = 'usually' | 'maybe' | null

export type ShiftAvailabilityRow = {
	shiftId: string
	shiftRecurrenceId: string | null
	value: AvailabilityValue
}

export type CalendarRequest = {
	id: string
	date: string
	startTime: string
	endTime: string
	type: 'substitute' | 'trade'
	requestedBy: UserSummary
	hasVolunteeredByMe: boolean
}

export type AvailabilityMatch = {
	user: UserSummary
	matchLevel: 'usually' | 'maybe'
}

export type NotificationType =
	| 'sub_request_accepted'
	| 'sub_request_assignment'
	| 'sub_request_cancelled'
	| 'sub_request_expired'
	| 'sub_request_reopened'
	| 'sub_request_volunteered'
