// lib/actions/permissions/grant-user-permission.ts
'use server'

import { db } from '@/db'
import { userPermissionGrants } from '@/db/schema/tables/permissions'
import { can } from '@/lib/permissions/can'
import { requireRole } from '@/utils/require-role'

export async function grantUserPermission(
	locale: string,
	userId: string,
	permission: string,
	endsAt?: Date,
	notes?: string
) {
	const actor = await requireRole(locale, ['Admin', 'Director'])

	const actorRole = actor.role ?? 'Patron'

	if (!(await can(actor.id, actorRole, 'users.edit'))) {
		throw new Error('Unauthorized')
	}

	await db.insert(userPermissionGrants).values({
		userId,
		permission,
		grantedByUserId: actor.id,
		endsAt,
		notes,
	})
}
