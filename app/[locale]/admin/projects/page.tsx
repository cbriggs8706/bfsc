import { readProjectSummaries } from '@/lib/actions/projects/projects'
import { ProjectCardGrid } from '@/components/admin/projects/ProjectCardGrid'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminProjectsPage({ params }: Props) {
	const { locale } = await params

	const projects = await readProjectSummaries()

	return (
		<div className="p-4 space-y-4">
			<h1 className="text-2xl font-bold">Projects</h1>

			<ProjectCardGrid projects={projects} locale={locale} />
		</div>
	)
}
