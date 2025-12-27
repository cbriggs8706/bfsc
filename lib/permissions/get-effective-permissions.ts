// lib/permissions/get-effective-permissions.ts
import { db } from '@/db'
import { rolePermissions } from '@/db/schema/tables/permissions'
import { userPermissionGrants } from '@/db'
import { and, eq, isNull, gt, or } from 'drizzle-orm'

export async function getEffectivePermissions(
	userId: string,
	role: string
): Promise<string[]> {
	const now = new Date()

	const rolePerms = await db
		.select({ p: rolePermissions.permission })
		.from(rolePermissions)
		.where(eq(rolePermissions.role, role))

	const delegated = await db
		.select({ p: userPermissionGrants.permission })
		.from(userPermissionGrants)
		.where(
			and(
				eq(userPermissionGrants.userId, userId),
				or(
					isNull(userPermissionGrants.endsAt),
					gt(userPermissionGrants.endsAt, now)
				)
			)
		)

	return Array.from(new Set([...rolePerms, ...delegated].map((r) => r.p)))
}
