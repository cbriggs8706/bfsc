import { ProjectForm } from '@/components/admin/projects/ProjectForm'
import { readProjectForForm } from '@/lib/actions/projects/projects'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function AdminProjectUpdatePage({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const project = await readProjectForForm(id)
	if (!project) {
		redirect(`/${locale}/admin/projects`)
	}

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">
					{t('update')} {t('projects.title')}
				</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					{t('projects.sub')}
				</p>
			</div>
			<ProjectForm
				mode="update"
				initialValues={project}
				projectId={project.id}
				locale={locale}
			/>
		</div>
	)
}
