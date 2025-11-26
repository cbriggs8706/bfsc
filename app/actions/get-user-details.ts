'use server'

import { db } from '@/db/client'
import { user, account } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getUserDetails() {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	const [dbUser] = await db
		.select()
		.from(user)
		.where(eq(user.id, session.user.id))

	if (!dbUser) return null

	// Get auth providers (google, credentials, etc)
	const providers = await db
		.select()
		.from(account)
		.where(eq(account.userId, session.user.id))

	return {
		...dbUser,
		providers: providers.map((p) => p.provider),
	}
}
