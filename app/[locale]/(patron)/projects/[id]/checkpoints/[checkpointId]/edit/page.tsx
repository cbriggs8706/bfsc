import { CheckpointCompletionForm } from '@/components/projects/CheckpointCompletionForm'

type Props = {
	params: Promise<{
		locale: string
		id: string
		checkpointId: string
	}>
}

export default async function EditCheckpointPage({ params }: Props) {
	const { locale, id, checkpointId } = await params

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Checkpoint Progress</h1>
				<p className="text-sm text-muted-foreground">
					Mark this checkpoint complete. Minutes helps us keep track of how much
					time was spent on the entire project.{' '}
				</p>
			</div>
			<CheckpointCompletionForm
				mode="create"
				projectId={id}
				checkpointId={checkpointId}
				locale={locale}
			/>
		</div>
	)
}
