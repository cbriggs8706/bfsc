'use server'

import { db } from '@/db/client'
import { user, account } from '@/db/schema/tables/auth'
import { kioskPeople } from '@/db'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserDetailsData } from '@/components/auth/AuthUserDetails'

export async function getUserDetails(): Promise<UserDetailsData | null> {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	// 1️⃣ Load user
	const [dbUser] = await db
		.select()
		.from(user)
		.where(eq(user.id, session.user.id))

	if (!dbUser) return null

	// 2️⃣ Load auth providers
	const providerRows = await db
		.select()
		.from(account)
		.where(eq(account.userId, session.user.id))

	// 3️⃣ Load kiosk person (optional)
	const [kiosk] = await db
		.select()
		.from(kioskPeople)
		.where(eq(kioskPeople.userId, session.user.id))

	// 4️⃣ Return a merged, UI-safe shape
	return {
		id: dbUser.id,
		name: dbUser.name,
		username: dbUser.username,
		email: dbUser.email,
		role: dbUser.role,

		providers: providerRows.map((p) => p.provider),

		kioskPersonId: kiosk?.id,
		profileImageUrl: kiosk?.profileImageUrl ?? null,

		createdAt: kiosk.createdAt,
	}
}
