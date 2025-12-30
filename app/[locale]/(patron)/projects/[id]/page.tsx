import { ProjectCheckpointTable } from '@/components/projects/ProjectCheckpointTable'
import { ProjectReadView } from '@/components/projects/ProjectReadView'
import { readProjectCheckpoints } from '@/lib/actions/projects/checkpoints'
import { readPublicProject } from '@/lib/actions/projects/projects'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function ProjectPage({ params }: Props) {
	const { locale, id } = await params

	const project = await readPublicProject(id)
	if (!project) return null

	const checkpoints = await readProjectCheckpoints(id)

	return (
		<div className="p-4 space-y-6">
			<ProjectReadView project={project} />
			<ProjectCheckpointTable
				projectId={id}
				checkpoints={checkpoints}
				locale={locale}
			/>
		</div>
	)
}
