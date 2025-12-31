'use server'

import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { account, user } from '@/db/schema/tables/auth'
import { and, eq, isNull } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createPassword(newPassword: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return { success: false, message: 'Unauthorized' }
	}

	if (newPassword.length < 8) {
		return { success: false, message: 'Password too short' }
	}

	const hashed = await bcrypt.hash(newPassword, 10)

	// ✅ Drizzle-style "affected rows" check
	const updated = await db
		.update(user)
		.set({ passwordHash: hashed })
		.where(and(eq(user.id, session.user.id), isNull(user.passwordHash)))
		.returning({ id: user.id })

	if (updated.length === 0) {
		return { success: false, message: 'Password already exists' }
	}

	// Optional but good: add credentials provider if missing
	await db.insert(account).values({
		userId: session.user.id,
		provider: 'credentials',
		providerAccountId: session.user.id,
		type: 'credentials',
	})

	return { success: true }
}
