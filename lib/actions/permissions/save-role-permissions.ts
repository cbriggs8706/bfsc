// lib/actions/permissions/save-role-permissions.ts
'use server'

import { db } from '@/db'
import { rolePermissions } from '@/db/schema/tables/permissions'
import { can } from '@/lib/permissions/can'
import { requireRole } from '@/utils/require-role'
import { eq } from 'drizzle-orm'

export async function saveRolePermissions(
	locale: string,
	role: string,
	permissions: string[]
) {
	// 1️⃣ Authenticate & get actor
	const actor = await requireRole(locale, ['Admin', 'Director'])

	// 2️⃣ Normalize actor role (never infer from target role)
	const actorRole = actor.role ?? 'Patron'

	// 3️⃣ Permission check
	if (!(await can(actor.id, actorRole, 'users.edit'))) {
		throw new Error('Unauthorized')
	}

	// 4️⃣ Transactional save
	await db.transaction(async (tx) => {
		await tx.delete(rolePermissions).where(eq(rolePermissions.role, role))

		if (permissions.length > 0) {
			await tx.insert(rolePermissions).values(
				permissions.map((permission) => ({
					role,
					permission,
				}))
			)
		}
	})
}
