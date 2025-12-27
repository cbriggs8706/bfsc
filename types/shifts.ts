// types/shifts.ts

export type Recurrence = {
	id: string
	label: string
	weekOfMonth: number | null
	isActive: boolean
	sortOrder: number
}

export type Shift = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	isActive: boolean
	notes: string | null
	recurrences: Recurrence[]
}

export type TimeFormat =
	| 'h:mm a' // 4:00 PM
	| 'hh:mm a' // 04:00 PM
	| 'H:mm' // 16:00
	| 'HH:mm' // 16:00

export type Day = {
	weekday: number
	label: string
	opensAt: string
	closesAt: string
}

export type DaySimple = {
	weekday: number
	label: string
}

export type ShiftInstance = {
	shiftId: string
	shiftRecurrenceId: string
	date: string // YYYY-MM-DD

	startTime: string
	endTime: string

	assignedUserIds: string[] // after exceptions applied

	isException: boolean
	exceptionType?: 'remove' | 'add' | 'replace'

	notes?: string
}

export type AssignmentRole = 'worker' | 'shift_lead' | 'trainer'

export type Assignment = {
	id: string
	shiftRecurrenceId: string
	userId: string
	// assignmentRole: string
	assignmentRole: AssignmentRole
	notes: string | null

	userName: string | null
	userRole: string
	userEmail: string
}
