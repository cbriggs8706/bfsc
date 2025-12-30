import { ProjectForm } from '@/components/admin/projects/ProjectForm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminProjectCreatePage({ params }: Props) {
	const { locale } = await params

	return (
		<div className="p-4 space-y-4">
			<ProjectForm mode="create" locale={locale} />
		</div>
	)
}
