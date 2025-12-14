//app/actions/cases/mark-mention-read.ts
'use server'

import { db, commentMentions } from '@/db'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function markMentionRead(mentionId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	await db
		.update(commentMentions)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(commentMentions.id, mentionId),
				eq(commentMentions.mentionedUserId, user.id),
				isNull(commentMentions.readAt)
			)
		)
}
