// lib/permissions/can.ts
import { getEffectivePermissions } from './get-effective-permissions'

export async function can(userId: string, role: string, permission: string) {
	const perms = await getEffectivePermissions(userId, role)
	return perms.includes(permission)
}
