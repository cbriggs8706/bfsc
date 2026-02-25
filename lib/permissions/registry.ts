// lib/permissions/registry.ts
export type PermissionKey =
	| 'users.view'
	| 'users.edit'
	| 'users.create'
	| 'newsletters.create'
	| 'newsletters.update'
	| 'newsletters.delete'
	| 'newsletters.publish'
	| 'newsletters.view'
	| 'shifts.assign'
	| 'shifts.edit'
	| 'shiftassignments.view'
	| 'shiftassignments.edit'
	| 'shiftavailability.view'
	| 'shiftavailability.edit'
	| 'substitutes.view'
	| 'substitutes.edit'
	| 'shiftreport.view'
	| 'shiftreport.edit'
	| 'classes.view'
	| 'classes.edit'
	| 'cases.view'
	| 'cases.edit'
	| 'cases.delete'
	| 'training.create'
	| 'training.view'
	| 'training.complete'
	| 'centerdefinitions.view'
	| 'centerdefinitions.edit'
	| 'closures.view'
	| 'closures.edit'
	| 'announcements.view'
	| 'announcements.edit'
	| 'equipment.view'
	| 'equipment.edit'
	| 'resources.view'
	| 'resources.edit'
	| 'reservations.view'
	| 'reservations.edit'

export type PermissionCategory =
	| 'users'
	| 'center'
	| 'workers'
	| 'resources'
	| 'communication'

export interface PermissionDef {
	key: PermissionKey
	category: PermissionCategory
}

export const PERMISSIONS: PermissionDef[] = [
	{ key: 'users.view', category: 'users' },
	{ key: 'users.edit', category: 'users' },
	{ key: 'users.create', category: 'users' },
	{ key: 'newsletters.create', category: 'communication' },
	{ key: 'newsletters.update', category: 'communication' },
	{ key: 'newsletters.delete', category: 'communication' },
	{ key: 'newsletters.publish', category: 'communication' },
	{ key: 'newsletters.view', category: 'communication' },
	{ key: 'shifts.assign', category: 'center' },
	{ key: 'shifts.edit', category: 'center' },
	{ key: 'shiftassignments.view', category: 'workers' },
	{ key: 'shiftassignments.edit', category: 'workers' },
	{ key: 'shiftavailability.view', category: 'workers' },
	{ key: 'shiftavailability.edit', category: 'workers' },
	{ key: 'substitutes.view', category: 'workers' },
	{ key: 'substitutes.edit', category: 'workers' },
	{ key: 'shiftreport.view', category: 'center' },
	{ key: 'shiftreport.edit', category: 'center' },
	{ key: 'classes.view', category: 'workers' },
	{ key: 'classes.edit', category: 'workers' },
	{ key: 'cases.view', category: 'workers' },
	{ key: 'cases.edit', category: 'workers' },
	{ key: 'cases.delete', category: 'workers' },
	{ key: 'training.create', category: 'workers' },
	{ key: 'training.view', category: 'workers' },
	{ key: 'training.complete', category: 'workers' },
	{ key: 'centerdefinitions.view', category: 'center' },
	{ key: 'centerdefinitions.edit', category: 'center' },
	{ key: 'closures.view', category: 'center' },
	{ key: 'closures.edit', category: 'center' },
	{ key: 'announcements.view', category: 'communication' },
	{ key: 'announcements.edit', category: 'communication' },
	{ key: 'equipment.view', category: 'resources' },
	{ key: 'equipment.edit', category: 'resources' },
	{ key: 'resources.view', category: 'resources' },
	{ key: 'resources.edit', category: 'resources' },
	{ key: 'reservations.view', category: 'resources' },
	{ key: 'reservations.edit', category: 'resources' },
]

//TODO Notes on Auth pattern
// Can you see this page?
// await requireRole(locale, ['Admin', 'Director'], `/${locale}`)

// Permission based actions
// if (!(await can(session.user.id, session.user.role, 'newsletters.create'))) {
//   throw new Error('Unauthorized')
// }

// UI rendering (localized)
// const permissions = await getEffectivePermissions(
//   session.user.id,
//   session.user.role
// )

// const canCreateNewsletter = permissions.includes('newsletters.create')

// Localization
// permission = 'newsletters.create'
// {
//   "labels": {
//     "newsletters.create": "Crear boletines"
//   }
// }
// const t = useTranslations('permissions')

// <p>{t(`labels.${permission}`)}</p>
