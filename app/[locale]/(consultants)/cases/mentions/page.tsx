// app/[locale]/(consultants)/cases/mentions/page.tsx
import { db } from '@/db'
import { commentMentions, caseComments, cases, user } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { MentionsList } from '@/components/cases/MentionsList'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function MentionsPage({ params }: Props) {
	const { locale } = await params

	const currentUser = await getCurrentUser()
	if (!currentUser) redirect('/login')

	const mentions = await db
		.select({
			mentionId: commentMentions.id,
			caseId: commentMentions.caseId,
			commentId: commentMentions.commentId,
			readAt: commentMentions.readAt,
			commentBody: caseComments.body,
			caseTitle: cases.title,
			authorName: user.name,
		})
		.from(commentMentions)
		.leftJoin(caseComments, eq(commentMentions.commentId, caseComments.id))
		.leftJoin(cases, eq(commentMentions.caseId, cases.id))
		.leftJoin(user, eq(caseComments.authorUserId, user.id))
		.where(
			and(
				eq(commentMentions.mentionedUserId, currentUser.id),
				isNull(commentMentions.readAt)
			)
		)
		.orderBy(desc(commentMentions.createdAt))

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Mentions</h1>
				<p className="text-sm text-muted-foreground">Lorem ipsum</p>
			</div>
			<MentionsList locale={locale} initialMentions={mentions} />
		</div>
	)
}
