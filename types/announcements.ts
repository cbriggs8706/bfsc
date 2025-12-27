// types/announcements.ts
export type Role =
	| 'Admin'
	| 'Director'
	| 'Assistant Director'
	| 'Worker'
	| 'Shift Lead'
	| 'Patron'

export const ROLES: Role[] = [
	'Admin', //cameronbriggs8706@gmail.com
	'Director', //burleyfamilysearchcenter@gmail.com
	'Assistant Director', //cbriggshdm@gmail.com
	// 'High Councilman', //insurancenames@gmail.com
	'Shift Lead', //cameron@minicassiachronicles.com
	'Worker', //sassyscrapsidaho@gmail.com
	'Patron', //buddb8706@gmail.com
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
