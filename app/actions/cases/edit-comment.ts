// app/actions/cases/edit-comment.ts
'use server'

import { db } from '@/db'
import { caseComments } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function editComment(commentId: string, newBody: string) {
	const currentUser = await getCurrentUser()
	if (!currentUser) throw new Error('Unauthorized')

	const text = newBody.trim()
	if (!text) return

	const [updated] = await db
		.update(caseComments)
		.set({
			body: text,
			editedAt: new Date(),
		})
		.where(
			and(
				eq(caseComments.id, commentId),
				eq(caseComments.authorUserId, currentUser.id)
			)
		)
		.returning()

	if (!updated) return

	await supabaseAdmin.channel(`case-comments:${updated.caseId}`).send({
		type: 'broadcast',
		event: 'edit-comment',
		payload: {
			id: updated.id,
			body: updated.body,
			editedAt: updated.editedAt,
		},
	})
}
