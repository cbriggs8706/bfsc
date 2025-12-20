// db/queries/notifications.ts
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { NotificationType } from '@/types/substitutes'
import { eq, desc } from 'drizzle-orm'

export async function getUserNotifications(userId: string) {
	const rows = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))

	return rows.map((n) => ({
		id: n.id,
		message: n.message,
		readAt: n.readAt,
		createdAt: n.createdAt ?? new Date(), // ✅ guarantee Date
	}))
}

type Tx = {
	insert: typeof import('@/db').db.insert
}

export async function notify(
	tx: Tx,
	input: {
		userId: string
		type: NotificationType
		message: string
	}
) {
	await tx.insert(notifications).values({
		userId: input.userId,
		type: input.type,
		message: input.message,
	})
}
