// types/kiosk.ts

import { CertificateSummary } from './training'

export type PersonSource = 'kiosk' | 'user'

export type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isConsultant: boolean
	hasPasscode: boolean
	source?: PersonSource
}

export type OnShiftConsultant = {
	personId: string
	userId: string | null
	fullName: string
	profileImageUrl: string | null
}

export type Purpose = {
	id: number
	name: string
}

export type LibraryItemType = 'book' | 'equipment'

export type KioskStep =
	| 'identify'
	| 'choosePerson'
	| 'newPerson'
	| 'roleChoice'
	| 'visit'
	| 'shift'
	| 'consultants'
	| 'checkout' // ← future

export type CurrentPresence = {
	consultants: OnShiftConsultant[]
	patrons: {
		personId: string
		fullName: string
		profileImageUrl: string | null
		purposeName: string | null
	}[]
	certificatesByUser: Record<string, CertificateSummary[]>
}
