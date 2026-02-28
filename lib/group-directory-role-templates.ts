export const wardRoleTemplates = [
	'Bulletin',
	'Email Newsletter',
	'Tech Specialist',
	'TFH Leader',
	'TFH Consultant',
	'JustServe',
	'Facebook & Website',
	'Ward Mission Leader',
	'Singles 35+ Representative',
	'Bishop',
	'Relief Society President',
	'Young Womens President',
	'Primary President',
	'Self Reliance',
] as const

export const stakeRoleTemplates = [
	'Stake President',
	'Stake 1st Councelor',
	'Stake 2nd Councelor',
	'Stake BFSC Assistant Director 1',
	'Stake BFSC Assistant Director 2',
	'Stake Relief Society President',
	'Stake Communications 1',
	'Stake Communications 2',
	'Stake TFH Lead 1',
	'Stake TFH Lead 2',
	'Stake Singles 35+ Representative',
	'Stake Technology Specialist',
	'Stake Executive Secretary',
	'Stake TFH High Councilman',
] as const

export const contactRoleTemplates = [...wardRoleTemplates, ...stakeRoleTemplates] as const

export type DirectoryScopeType = 'stake' | 'ward'

export function getRoleTemplatesForScope(scopeType: DirectoryScopeType) {
	return scopeType === 'stake' ? stakeRoleTemplates : wardRoleTemplates
}
