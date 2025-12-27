// lib/actions/permissions/toggle-role-permission.ts
'use server'

import { db } from '@/db'
import { rolePermissions } from '@/db/schema/tables/permissions'
import { and, eq } from 'drizzle-orm'
import { requireRole } from '@/utils/require-role'
import { can } from '@/lib/permissions/can'

export async function toggleRolePermission(
	locale: string,
	role: string,
	permission: string,
	enabled: boolean
) {
	const actor = await requireRole(locale, ['Admin', 'Director'])
	const actorRole = actor.role ?? 'Patron'
	if (!(await can(actor.id, actorRole, 'users.edit'))) {
		throw new Error('Unauthorized')
	}
	if (enabled) {
		await db
			.insert(rolePermissions)
			.values({ role, permission })
			.onConflictDoNothing()
	} else {
		await db
			.delete(rolePermissions)
			.where(
				and(
					eq(rolePermissions.role, role),
					eq(rolePermissions.permission, permission)
				)
			)
	}
}
