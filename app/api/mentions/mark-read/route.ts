// app/api/mentions/mark-read/route.ts
import { db, commentMentions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, isNull, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const user = await getCurrentUser()
	if (!user) return NextResponse.json({}, { status: 401 })

	const { commentId } = await req.json()

	await db
		.update(commentMentions)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(commentMentions.commentId, commentId),
				eq(commentMentions.mentionedUserId, user.id),
				isNull(commentMentions.readAt)
			)
		)

	return NextResponse.json({ ok: true })
}
