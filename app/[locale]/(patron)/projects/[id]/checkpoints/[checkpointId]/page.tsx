import { readCheckpointDetail } from '@/lib/actions/projects/checkpoints'
import { CheckpointReadView } from '@/components/projects/CheckpointReadView'

type Props = {
	params: Promise<{
		locale: string
		id: string
		checkpointId: string
	}>
}

export default async function CheckpointPage({ params }: Props) {
	const { locale, id, checkpointId } = await params

	const data = await readCheckpointDetail(locale, checkpointId)
	if (!data) return null

	return (
		<div className="p-4">
			<CheckpointReadView projectId={id} checkpoint={data} locale={locale} />
		</div>
	)
}
