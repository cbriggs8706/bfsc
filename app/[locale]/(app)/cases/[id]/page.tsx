// app/[locale]/(app)/cases/[id]/page.tsx
import { db, kioskPeople } from '@/db'
import { cases, caseComments, caseAttachments, user } from '@/db'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CaseThread } from '@/components/cases/CaseThread'
import { markCaseSolved } from '@/app/actions/cases/mark-solved'
import { addComment } from '@/app/actions/cases/add-comment'

export default async function CasePage({
	params,
}: {
	params: Promise<{ id: string; locale: string }>
}) {
	const { id } = await params

	const currentUser = await getCurrentUser()
	if (!currentUser) redirect('/login')

	const [caseRow] = await db.select().from(cases).where(eq(cases.id, id))
	if (!caseRow) redirect('/cases')

	const comments = await db
		.select({
			id: caseComments.id,
			body: caseComments.body,
			createdAt: caseComments.createdAt,
			authorId: caseComments.authorUserId,
			replyToCommentId: caseComments.replyToCommentId,
			// priority fields
			kioskName: kioskPeople.fullName,
			kioskImage: kioskPeople.profileImageUrl,

			userName: user.name,
			userImage: user.image,
		})
		.from(caseComments)
		.leftJoin(kioskPeople, eq(caseComments.authorUserId, kioskPeople.userId))
		.leftJoin(user, eq(caseComments.authorUserId, user.id))
		.where(eq(caseComments.caseId, caseRow.id))
		.orderBy(caseComments.createdAt)

	const attachments = await db
		.select()
		.from(caseAttachments)
		.where(eq(caseAttachments.caseId, caseRow.id))

	const canSolve =
		caseRow.createdByUserId === currentUser.id || currentUser.role === 'Admin'

	return (
		<CaseThread
			caseId={caseRow.id}
			title={caseRow.title}
			status={caseRow.status}
			typeName="Case"
			submitterName={currentUser.name ?? 'User'}
			description={caseRow.description}
			currentUser={currentUser}
			comments={comments.map((c) => ({
				id: c.id,
				body: c.body,
				createdAt: c.createdAt,
				authorId: c.authorId,
				authorName: c.kioskName ?? c.userName ?? 'User',
				authorImage: c.kioskImage ?? c.userImage ?? null,
				replyToCommentId: c.replyToCommentId ?? null,
			}))}
			canSolve={canSolve}
			onSolve={async () => {
				'use server'
				await markCaseSolved(caseRow.id)
			}}
			onComment={async (body, replyTo, clientNonce) => {
				'use server'
				await addComment(caseRow.id, body, replyTo, clientNonce)
			}}
			attachments={attachments.map((a) => ({
				id: a.id,
				fileUrl: a.fileUrl,
				fileType: a.fileType,
			}))}
		/>
	)
}
