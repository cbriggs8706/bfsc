// app/[locale]/(patron)/projects/[id]/checkpoints/[checkpointId]/contribute/page.tsx
import { CheckpointContributionForm } from '@/components/projects/CheckpointContributionForm'
import { requireRole } from '@/utils/require-role'

type Props = {
	params: Promise<{
		locale: string
		id: string
		checkpointId: string
	}>
}

export default async function ContributeCheckpointPage({ params }: Props) {
	const { locale, id, checkpointId } = await params

	await requireRole(
		locale,
		[
			'Admin',
			'Director',
			'Assistant Director',
			'Shift Lead',
			'Worker',
			'Patron',
		],
		`/${locale}/projects/${id}/checkpoints/${checkpointId}`
	)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Checkpoint Progress</h1>
				<p className="text-sm text-muted-foreground">
					Log time spent working on this checkpoint. Multiple people can
					contribute time. An admin will mark it complete when finished.
				</p>
			</div>
			<CheckpointContributionForm
				mode="create"
				projectId={id}
				checkpointId={checkpointId}
				locale={locale}
			/>
		</div>
	)
}
