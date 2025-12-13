// app/[locale]/(app)/cases/mentions/page.tsx
import { db } from '@/db'
import { commentMentions, caseComments, cases, user } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, desc, isNull } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function MentionsPage() {
	const currentUser = await getCurrentUser()
	if (!currentUser) redirect('/login')

	const mentions = await db
		.select({
			mentionId: commentMentions.id,
			caseId: commentMentions.caseId,
			commentId: commentMentions.commentId,
			createdAt: commentMentions.createdAt,
			readAt: commentMentions.readAt,

			commentBody: caseComments.body,
			caseTitle: cases.title,

			authorName: user.name,
		})
		.from(commentMentions)
		.leftJoin(caseComments, eq(commentMentions.commentId, caseComments.id))
		.leftJoin(cases, eq(commentMentions.caseId, cases.id))
		.leftJoin(user, eq(caseComments.authorUserId, user.id))
		.where(eq(commentMentions.mentionedUserId, currentUser.id))
		.orderBy(desc(commentMentions.createdAt))

	return (
		<div className="max-w-3xl mx-auto p-4 space-y-4">
			<h1 className="text-xl font-bold">Mentions</h1>

			{mentions.length === 0 && (
				<p className="text-muted-foreground">You haven’t been mentioned yet.</p>
			)}

			<ul className="space-y-2">
				{mentions.map((m) => (
					<li
						key={m.mentionId}
						className={`rounded border p-3 ${!m.readAt ? 'bg-muted/40' : ''}`}
					>
						<div className="text-sm font-semibold">
							{m.authorName ?? 'User'} mentioned you in{' '}
							<span className="font-bold">{m.caseTitle}</span>
						</div>

						<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
							{m.commentBody}
						</p>

						<Link
							href={`/cases/${m.caseId}#comment-${m.commentId}`}
							className="mt-2 inline-block text-sm text-primary"
						>
							View comment →
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}
