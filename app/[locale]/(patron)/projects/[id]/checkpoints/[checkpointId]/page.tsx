import { readCheckpointDetail } from '@/lib/actions/projects/front-checkpoints'
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
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{data.name}</h1>
				<p className="text-sm text-muted-foreground"></p>
			</div>
			<CheckpointReadView projectId={id} checkpoint={data} locale={locale} />
		</div>
	)
}
