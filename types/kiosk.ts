// types/kiosk.ts

import { CertificateSummary } from './training'

export type PersonSource = 'kiosk' | 'user'

export type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isWorker: boolean
	hasPasscode: boolean
	source?: PersonSource
}

export type OnShiftWorker = {
	personId: string
	userId: string | null
	fullName: string
	profileImageUrl: string | null
	languages: string[]
	pid: string
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
	| 'workers'
	| 'checkout' // ← future

export type CurrentPresence = {
	workers: OnShiftWorker[]
	patrons: {
		personId: string
		fullName: string
		profileImageUrl: string | null
		purposeName: string | null
	}[]
	certificatesByUser: Record<string, CertificateSummary[]>
}
