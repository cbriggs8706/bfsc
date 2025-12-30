import { AdminCheckpointBulkForm } from '@/components/admin/projects/AdminCheckpointBulkForm'
import { ProjectCheckpointAdminTable } from '@/components/projects/ProjectCheckpointAdminTable'
import { readProjectCheckpoints } from '@/lib/actions/projects/front-checkpoints'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function AdminProjectCheckpointsPage({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const checkpoints = await readProjectCheckpoints(id)

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">
					{t('projects.manageCheckpoints')}
				</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					{t('projects.checkpointsSub')}
				</p>
			</div>

			<AdminCheckpointBulkForm projectId={id} locale={locale} />
			<ProjectCheckpointAdminTable
				projectId={id}
				checkpoints={checkpoints}
				locale={locale}
				canEdit
			/>
		</div>
	)
}
