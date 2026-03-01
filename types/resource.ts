import { ShiftType } from './shifts'

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
	shiftType: ShiftType
	weeklyShiftId: string
}

export type StaffRecipient = {
	name: string | null
	email: string
	role: 'Director' | 'Assistant Director' | 'Shift Leader'
}

export type AvailabilityResponse = {
	resourceId: string
	date: string
	status: AvailabilityStatus
	defaultDurationMinutes: number
	capacity: number | null
	// requiresClosedDayAck: boolean
	timeSlots: TimeSlot[]
	opensAt?: string | null
	closesAt?: string | null
}

export type ResourceType = 'equipment' | 'room' | 'booth' | 'activity'

export type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

//TODO delete? duplicate of Reservation
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

export interface Reservation {
	id?: string

	resourceId: string
	userId: string

	startTime: Date
	endTime: Date

	attendeeCount?: number
	assistanceLevel?: AssistanceLevel

	isClosedDayRequest?: boolean

	status?: ReservationStatus

	confirmedByUserId?: string | null
	assignedWorkerId?: string | null

	notes?: string | null

	createdAt?: Date
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
	image: string | null
	link: string | null
	video: string | null

	isActive: boolean
}

export type ReservationWithUser = Reservation & {
	user: {
		id: string
		name: string | null
		email: string | null
	}
	resource: {
		id: string
		name: string
	}
}

export type ResourceFormValues = {
	name: string
	type: ResourceType
	defaultDurationMinutes: string
	maxConcurrent: string
	capacity: string
	isActive: boolean
	description: string
	requiredItems: string
	prep: string
	notes: string
	link: string
	video: string
	image: string
}
