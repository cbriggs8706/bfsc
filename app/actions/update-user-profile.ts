//TODO do i delete this now that i've created update-kiosk-profile action?
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db/client'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'

/**
 * Allows updating ONLY:
 * - name
 * - username
 * - image
 */
export async function updateUserProfile(data: {
	name?: string
	username?: string
	image?: string
}) {
	const session = await getServerSession(authOptions)

	if (!session || !session.user?.id) {
		return { guest: true }
	}

	const userId = session.user.id

	// Remove undefined values so they are not overwritten as NULL
	const cleaned = Object.fromEntries(
		Object.entries(data).filter(([_, v]) => v !== undefined)
	)

	if (Object.keys(cleaned).length === 0) {
		return { error: 'No fields to update' }
	}

	try {
		const [updated] = await db
			.update(user)
			.set(cleaned)
			.where(eq(user.id, userId))
			.returning()

		return updated
	} catch (err) {
		console.error('❌ updateUserProfile ERROR:', err)
		return { error: 'Update failed' }
	}
}
