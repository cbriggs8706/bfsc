// app/actions/notifications/mark-all-read.ts
'use server'

import { db, notifications } from '@/db'
import { authOptions } from '@/lib/auth'
import { and, eq, isNull } from 'drizzle-orm'
import { getServerSession } from 'next-auth'

export async function markAllNotificationsRead() {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return

	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notifications.userId, session.user.id),
				isNull(notifications.readAt)
			)
		)
}
