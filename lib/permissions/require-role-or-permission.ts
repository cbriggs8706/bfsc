import 'server-only'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'
import { getEffectivePermissions } from '@/lib/permissions/get-effective-permissions'
import type { PermissionKey } from '@/lib/permissions/registry'

export async function requireRoleOrPermission(
	locale: string,
	options: {
		allowedRoles?: readonly string[]
		allowedPermissions?: readonly PermissionKey[]
		redirectTo?: string
	}
) {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		const target = options.redirectTo ?? `/${locale}`
		redirect(`/${locale}/login?redirect=${encodeURIComponent(target)}`)
	}

	const role = session.user.role ?? 'Patron'
	if (options.allowedRoles?.includes(role)) {
		return session.user
	}

	if (options.allowedPermissions?.length) {
		const permissions = await getEffectivePermissions(session.user.id, role)
		if (options.allowedPermissions.some((permission) => permissions.includes(permission))) {
			return session.user
		}
	}

	redirect(options.redirectTo ?? `/${locale}`)
}
