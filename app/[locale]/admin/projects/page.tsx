import { readProjectSummaries } from '@/lib/actions/projects/projects'
import { ProjectCardGrid } from '@/components/admin/projects/ProjectCardGrid'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminProjectsPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const projects = await readProjectSummaries()

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{t('projects.title')}</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					{t('projects.sub')}
				</p>
				<Link href={`/${locale}/admin/projects/create`}>
					<Button>
						{t('create')} {t('projects.title')}
					</Button>
				</Link>
			</div>

			<ProjectCardGrid projects={projects} locale={locale} isAdmin />
		</div>
	)
}
