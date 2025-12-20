// app/actions/notifications/mark-read.ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema/tables/notifications'
import { eq, and, isNull } from 'drizzle-orm'

export async function markNotificationRead(notificationId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return

	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notifications.id, notificationId),
				eq(notifications.userId, session.user.id),
				isNull(notifications.readAt)
			)
		)
}
