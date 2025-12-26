import { ReservationStatus } from './resource'

export type PatronVisit = {
	personId: string
	fullName: string
	signedInAt: string // ISO string from API
	purposeName: string | null
}

export type ConsultantShift = {
	personId: string
	fullName: string
	profileImageUrl: string | null
	arrivalAt: string
	expectedDepartureAt: string
	actualDepartureAt: string | null
}

export type ShiftReportItem = {
	consultant: ConsultantShift
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
	consultantName: string
	arrivalAt: Date
	departureAt: Date
	patrons: ShiftReportPatron[]
}

export interface DateRange {
	start: Date
	end: Date
}

export type ShiftSlotConsultant = {
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
	consultants: ShiftSlotConsultant[]
	patrons: ShiftSlotPatron[]
}

export type TodayShift = {
	shiftId: string
	weekday: number
	startTime: string
	endTime: string
	consultants: ShiftReportConsultant[]
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
	consultants: number
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
	consultants: number
	patrons: number
}

export type ShiftReportConsultant = {
	shiftLogId: string
	userId: string
	fullName: string
	profileImageUrl: string | null
	arrivalAt: Date
	actualDepartureAt: Date | null
}
