// types/resources.ts
export type ResourceOption = {
	id: string
	name: string
	type: ResourceType
	defaultDurationMinutes: number
	capacity: number | null
}

export type ReservationFormState = {
	resourceId: string
	date: string // YYYY-MM-DD
	startTime: string // HH:mm
	attendeeCount: number
	assistanceLevel: AssistanceLevel
	isClosedDayRequest: boolean
	notes: string
}

export type AvailabilityStatus = 'open' | 'closed' | 'closed_by_appointment'
export type AssistanceLevel = 'none' | 'startup' | 'full'

export type TimeSlot = {
	startTime: string // "10:00"
	endTime: string // "12:00"
	isAvailable: boolean
	reason?: string
}

export type AvailabilityResponse = {
	resourceId: string
	date: string
	status: AvailabilityStatus
	defaultDurationMinutes: number
	capacity: number | null
	requiresClosedDayAck: boolean
	timeSlots: TimeSlot[]
}

export type ResourceType = 'equipment' | 'room' | 'booth' | 'activity'

export type ReservationStatus = 'pending' | 'approved' | 'denied' | 'cancelled'

export type ReservationApprovalAction = 'approve' | 'deny'

export type ReservationListItem = {
	id: string
	resourceName: string
	resourceType: ResourceType
	startTime: string
	endTime: string
	isClosedDayRequest: boolean
	attendeeCount: number
	assistanceLevel: AssistanceLevel
	requestedByName: string | null
	notes: string | null
}

export type Resource = {
	id: string
	name: string
	type: ResourceType
	defaultDurationMinutes: number
	maxConcurrent: number
	capacity: number | null

	description: string | null
	requiredItems: string | null
	prep: string | null
	notes: string | null
	link: string | null

	isActive: boolean
}
