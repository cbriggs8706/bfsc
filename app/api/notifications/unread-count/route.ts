// app/api/notifications/unread-count/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { notifications } from '@/db'
import { eq, isNull, and, sql } from 'drizzle-orm'

export async function GET() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		return NextResponse.json({ count: 0 })
	}

	const result = await db
		.select({
			count: sql<number>`count(*)`,
		})
		.from(notifications)
		.where(
			and(
				eq(notifications.userId, session.user.id),
				isNull(notifications.readAt)
			)
		)

	return NextResponse.json({
		count: result[0]?.count ?? 0,
	})
}
