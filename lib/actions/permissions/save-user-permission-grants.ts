// lib/actions/permissions/save-user-permission-grants.ts
'use server'

import { db } from '@/db'
import { userPermissionGrants } from '@/db/schema/tables/permissions'
import { can } from '@/lib/permissions/can'
import { requireRole } from '@/utils/require-role'
import { eq } from 'drizzle-orm'

export async function saveUserPermissionGrants(
	locale: string,
	userId: string,
	grants: { permission: string; endsAt?: Date | null }[]
) {
	const actor = await requireRole(locale, ['Admin', 'Director'])
	const actorRole = actor.role ?? 'Patron'
	if (!(await can(actor.id, actorRole, 'users.edit'))) {
		throw new Error('Unauthorized')
	}
	await db.transaction(async (tx) => {
		// Remove existing grants
		await tx
			.delete(userPermissionGrants)
			.where(eq(userPermissionGrants.userId, userId))

		// Insert new grants
		if (grants.length > 0) {
			await tx.insert(userPermissionGrants).values(
				grants.map((g) => ({
					userId,
					permission: g.permission,
					endsAt: g.endsAt ?? null,
					grantedByUserId: actor.id,
				}))
			)
		}
	})
}
