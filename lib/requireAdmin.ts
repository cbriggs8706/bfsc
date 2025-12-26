// lib/requireAdmin.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireAdmin() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		throw new Error('Not authenticated')
	}

	if (session.user.role !== 'Admin') {
		throw new Error('Not authorized')
	}

	return session.user
}
