// types/announcements.ts
export type Role =
	| 'Admin'
	| 'Director'
	| 'Assistant Director'
	| 'High Councilman'
	| 'Consultant'
	| 'Shift Lead'
	| 'Patron'

export const ROLES: Role[] = [
	'Admin',
	'Director',
	'Assistant Director',
	'High Councilman',
	'Consultant',
	'Shift Lead',
	'Patron',
]

export interface AnnouncementPayloadWithId {
	id: string
	title: string
	body: string
	roles: Role[]
	expiresAt: string | null
	imageUrl?: string | null
}
export interface AnnouncementPayload {
	title: string
	body: string
	roles: Role[]
	expiresAt: string | null
	imageUrl?: string | null
}

export type AnnouncementUpdatePayload = Partial<{
	title: string
	body: string
	roles: Role[]
	expiresAt: string | null
	imageUrl: string | null
}>
