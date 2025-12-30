import { ProjectForm } from '@/components/admin/projects/ProjectForm'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminProjectCreatePage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">
					{t('create')} {t('projects.title')}
				</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					{t('projects.sub')}
				</p>
			</div>
			<ProjectForm mode="create" locale={locale} />
		</div>
	)
}
