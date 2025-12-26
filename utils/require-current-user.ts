// utils/require-current-user.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export type CurrentUser = {
	id: string
	role: string
	name: string | null
	email: string
	username: string | null
}

export async function requireCurrentUser(locale: string): Promise<CurrentUser> {
	const session = await getSession()

	if (!session?.user?.id) {
		redirect(`/${locale}/login`)
	}

	return {
		id: session.user.id,
		role: session.user.role ?? 'Patron',
		name: session.user.name ?? null,
		email: session.user.email ?? '',
		username: session.user.username ?? null,
	}
}
