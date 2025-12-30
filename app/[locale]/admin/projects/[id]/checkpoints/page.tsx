import { AdminCheckpointBulkForm } from '@/components/admin/projects/AdminCheckpointBulkForm'
import { ProjectCheckpointTable } from '@/components/projects/ProjectCheckpointTable'
import { readProjectCheckpoints } from '@/lib/actions/projects/checkpoints'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function AdminProjectCheckpointsPage({ params }: Props) {
	const { locale, id } = await params
	const checkpoints = await readProjectCheckpoints(id)

	return (
		<div className="p-4 space-y-4">
			<h1 className="text-xl font-semibold">Manage Checkpoints</h1>

			<AdminCheckpointBulkForm projectId={id} locale={locale} />
			<ProjectCheckpointTable
				projectId={id}
				checkpoints={checkpoints}
				locale={locale}
			/>
		</div>
	)
}
