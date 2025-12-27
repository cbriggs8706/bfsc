// utils/require-role.ts
import 'server-only'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export async function requireRole(
	locale: string,
	allowedRoles: readonly string[],
	redirectTo?: string
) {
	const session = await getServerSession(authOptions)

	// 🚫 Not logged in
	if (!session?.user) {
		const target = redirectTo ?? `/${locale}`
		redirect(`/${locale}/login?redirect=${encodeURIComponent(target)}`)
	}

	const role = session.user.role ?? 'Patron'

	// 🚫 Logged in, wrong role
	if (!allowedRoles.includes(role)) {
		redirect(redirectTo ?? `/${locale}`)
	}

	// ✅ Authenticated + allowed
	return session.user
}
