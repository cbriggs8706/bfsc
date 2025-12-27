// lib/actions/permissions/revoke-user-permission.ts
'use server'

import { db } from '@/db'
import { userPermissionGrants } from '@/db/schema/tables/permissions'
import { can } from '@/lib/permissions/can'
import { requireRole } from '@/utils/require-role'
import { eq } from 'drizzle-orm'

export async function revokeUserPermission(locale: string, grantId: string) {
	const actor = await requireRole(locale, ['Admin', 'Director'])
	const actorRole = actor.role ?? 'Patron'
	if (!(await can(actor.id, actorRole, 'users.edit'))) {
		throw new Error('Unauthorized')
	}

	await db
		.delete(userPermissionGrants)
		.where(eq(userPermissionGrants.id, grantId))
}
