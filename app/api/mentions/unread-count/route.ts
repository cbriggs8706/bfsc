// app/api/mentions/unread-count/route.ts
import { db, commentMentions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, isNull, and, count } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
	const user = await getCurrentUser()
	if (!user) return NextResponse.json({ count: 0 })

	const [result] = await db
		.select({
			count: count(commentMentions.id),
		})
		.from(commentMentions)
		.where(
			and(
				eq(commentMentions.mentionedUserId, user.id),
				isNull(commentMentions.readAt)
			)
		)

	return NextResponse.json({
		count: Number(result?.count ?? 0),
	})
}
