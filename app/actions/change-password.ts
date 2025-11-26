'use server'

import bcrypt from 'bcryptjs'
import { db } from '@/db/client'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function changePassword({
	currentPassword,
	newPassword,
}: {
	currentPassword: string
	newPassword: string
}) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return { success: false, message: 'Unauthorized' }

	const found = await db.select().from(user).where(eq(user.id, session.user.id))

	if (!found[0] || !found[0].passwordHash) {
		return { success: false, message: 'No password found (OAuth user?)' }
	}

	const valid = await bcrypt.compare(currentPassword, found[0].passwordHash)
	if (!valid) return { success: false, message: 'Incorrect password' }

	const hashed = await bcrypt.hash(newPassword, 10)

	await db
		.update(user)
		.set({ passwordHash: hashed })
		.where(eq(user.id, session.user.id))

	return { success: true }
}
