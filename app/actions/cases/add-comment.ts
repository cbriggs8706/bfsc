// app/actions/cases/add-comment.ts
'use server'

import { commentMentions, db, kioskPeople } from '@/db'
import { caseComments, user } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, inArray } from 'drizzle-orm'
import { supabaseAdmin } from '@/lib/supabase-admin'

function extractMentions(text: string): string[] {
	const matches = text.match(/@([\w.-]+)/g)
	return matches ? matches.map((m) => m.slice(1)) : []
}

export async function addComment(
	caseId: string,
	body: string,
	replyToCommentId?: string,
	clientNonce?: string
) {
	const currentUser = await getCurrentUser()
	if (!currentUser) throw new Error('Unauthorized')

	const text = body.trim()
	if (!text) return

	/* 1️⃣ Insert comment FIRST */
	const [comment] = await db
		.insert(caseComments)
		.values({
			caseId,
			body: text,
			authorUserId: currentUser.id,
			replyToCommentId: replyToCommentId ?? null,
		})
		.returning()

	/* 2️⃣ Resolve author (kiosk → user fallback) */
	const [kiosk] = await db
		.select({
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
		})
		.from(kioskPeople)
		.where(eq(kioskPeople.userId, currentUser.id))
		.limit(1)

	const [u] = kiosk
		? []
		: await db
				.select({
					name: user.name,
					image: user.image,
				})
				.from(user)
				.where(eq(user.id, currentUser.id))
				.limit(1)

	const authorName = kiosk?.fullName ?? u?.name ?? 'User'
	const authorImage = kiosk?.profileImageUrl ?? u?.image ?? null

	/* 3️⃣ Extract + resolve mentions */
	const mentionedUsernames = extractMentions(text)

	let mentionedUsers: { id: string }[] = []

	if (mentionedUsernames.length > 0) {
		mentionedUsers = await db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.username, mentionedUsernames))

		if (mentionedUsers.length > 0) {
			await db.insert(commentMentions).values(
				mentionedUsers.map((u) => ({
					commentId: comment.id,
					caseId,
					mentionedUserId: u.id,
				}))
			)
		}
	}

	/* 4️⃣ Broadcast comment to thread */
	await supabaseAdmin
		.channel(`case-comments:${caseId}`)
		.httpSend('new-comment', {
			id: comment.id,
			caseId,
			body: comment.body,
			createdAt: comment.createdAt,
			replyToCommentId: comment.replyToCommentId,
			clientNonce,
			author: {
				id: currentUser.id,
				name: authorName,
				image: authorImage,
			},
		})

	/* 5️⃣ Broadcast mention notifications (THIS is where it goes) */
	for (const u of mentionedUsers) {
		await supabaseAdmin.channel(`user-mentions:${u.id}`).httpSend('mentioned', {
			caseId,
			commentId: comment.id,
			author: {
				id: currentUser.id,
				name: authorName,
				image: authorImage,
			},
			body: comment.body,
		})
	}
}
