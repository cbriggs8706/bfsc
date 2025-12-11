// lib/isConsultantRole.ts
const CONSULTANT_ROLES = [
	'Consultant',
	'Shift Lead',
	'Assistant Director',
	'Director',
	'High Councilman',
] as const

export type ConsultantRole = (typeof CONSULTANT_ROLES)[number]

export function isConsultantRole(role: string | null | undefined): boolean {
	if (!role) return false
	return CONSULTANT_ROLES.includes(role as ConsultantRole)
}
