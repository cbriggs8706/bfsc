// utils/require-role.ts
import 'server-only'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export async function requireRole(
	locale: string,
	allowedRoles: string[],
	redirectTo?: string
) {
	const session = await getServerSession(authOptions)

	// 🚫 Not logged in
	if (!session?.user) {
		const target = redirectTo
			? `/${locale}/login?redirect=${encodeURIComponent(redirectTo)}`
			: `/${locale}/login`

		redirect(target)
	}

	const role = session.user.role ?? 'Patron'

	// 🚫 Logged in but wrong role
	if (!allowedRoles.includes(role)) {
		redirect(`/${locale}`)
	}

	// ✅ Fully safe now
	return session.user
}
