// app/actions/cases/delete-comment.ts
'use server'

import { db } from '@/db'
import { caseComments } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function deleteComment(commentId: string) {
	const currentUser = await getCurrentUser()
	if (!currentUser) throw new Error('Unauthorized')

	const [deleted] = await db
		.delete(caseComments)
		.where(
			and(
				eq(caseComments.id, commentId),
				eq(caseComments.authorUserId, currentUser.id)
			)
		)
		.returning()

	if (!deleted) return

	await supabaseAdmin.channel(`case-comments:${deleted.caseId}`).send({
		type: 'broadcast',
		event: 'delete-comment',
		payload: {
			id: deleted.id,
		},
	})
}
