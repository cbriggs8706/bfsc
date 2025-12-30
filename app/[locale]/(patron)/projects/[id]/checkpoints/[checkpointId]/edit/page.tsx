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
		<div className="p-4">
			<CheckpointCompletionForm
				mode="create"
				projectId={id}
				checkpointId={checkpointId}
				locale={locale}
			/>
		</div>
	)
}
