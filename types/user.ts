// types/user.ts
export type UpdateUserProfileInput = {
	name?: string
	username?: string
	image?: string
}

export type UserSummary = {
	userId: string
	name: string
	imageUrl: string | null
}

export const roles = [
	'Admin',
	'Director',
	'Assistant Director',
	'Shift Lead',
	'Worker',
	'Patron',
]
