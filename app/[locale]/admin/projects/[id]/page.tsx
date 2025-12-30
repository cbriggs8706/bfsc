import { ProjectForm } from '@/components/admin/projects/ProjectForm'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function AdminProjectReadPage({ params }: Props) {
	const { locale, id } = await params

	return (
		<div className="p-4 space-y-4">
			<ProjectForm mode="read" locale={locale} id={id} />
		</div>
	)
}
