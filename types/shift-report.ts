import { ReservationStatus } from './resource'

export type PatronVisit = {
	personId: string
	fullName: string
	signedInAt: string // ISO string from API
	purposeName: string | null
}

export type WorkerShift = {
	personId: string
	fullName: string
	profileImageUrl: string | null
	arrivalAt: string
	expectedDepartureAt: string
	actualDepartureAt: string | null
}

export type ShiftReportItem = {
	worker: WorkerShift
	patrons: PatronVisit[]
}

export type ShiftReportResponse = {
	date: string
	report: ShiftReportItem[]
}

export interface ShiftReportPatron {
	visitId: string
	fullName: string
	purposeName: string | null
	arrivedAt: Date
}

export interface ShiftReportRow {
	shiftId: string
	workerName: string
	arrivalAt: Date
	departureAt: Date
	patrons: ShiftReportPatron[]
}

export interface DateRange {
	start: Date
	end: Date
}

export type ShiftSlotWorker = {
	kioskShiftLogId: string
	userId: string
	fullName: string
	arrivalAtIso: string
	expectedDepartureAtIso: string
}

export type ShiftSlotPatron = {
	visitId: string
	fullName: string
	purposeName: string | null
	createdAtIso: string
}

export type ShiftSlotReport = {
	slotId: string
	date: string // YYYY-MM-DD
	weekday: number
	weeklyShiftId: string
	startTime: string
	endTime: string
	label: string
	notes: string | null
	sortOrder: number
	startAtIso: string
	endAtIso: string
	workers: ShiftSlotWorker[]
	patrons: ShiftSlotPatron[]
}

export type TodayShift = {
	shiftId: string
	weekday: number
	startTime: string
	endTime: string
	workers: ShiftReportWorker[]
	patrons: {
		visitId: string
		fullName: string
		purposeName?: string | null
		arrivedAt: Date
		departedAt: Date | null
	}[]
	reservations: ShiftReservation[]
}

export type ShiftReservation = {
	id: string
	resourceName: string
	startTime: string // "HH:mm"
	endTime: string // "HH:mm"
	status: ReservationStatus
	patronName: string
}

export type SummaryPoint = {
	label: string // "Mon", "Dec", etc
	workers: number
	patrons: number
}

export type SummaryResponse = {
	granularity: 'day' | 'month'
	data: SummaryPoint[]
}

export type DateRangePreset =
	| 'wtd'
	| 'lastWeek'
	| 'mtd'
	| 'lastMonth'
	| 'ytd'
	| 'lastYear'

export type ShiftSummaryPoint = {
	label: string // day or month label
	workers: number
	patrons: number
}

export type ShiftReportWorker = {
	shiftLogId: string
	userId: string
	fullName: string
	profileImageUrl: string | null
	arrivalAt: Date
	actualDepartureAt: Date | null
}
