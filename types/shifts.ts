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

export type Day = {
	weekday: number
	label: string
	opensAt: string
	closesAt: string
}
