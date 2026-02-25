import 'server-only'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { can } from '@/lib/permissions/can'
import type { PermissionKey } from '@/lib/permissions/registry'

export async function requirePermission(
	locale: string,
	permission: PermissionKey,
	redirectTo?: string
) {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		const target = redirectTo ?? `/${locale}`
		redirect(`/${locale}/login?redirect=${encodeURIComponent(target)}`)
	}

	const role = session.user.role ?? 'Patron'
	const allowed = await can(session.user.id, role, permission)
	if (!allowed) {
		redirect(redirectTo ?? `/${locale}`)
	}

	return session.user
}
