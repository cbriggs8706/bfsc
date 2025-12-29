// app/[locale]/admin/center/resources/page.tsx
import { readAllResources } from '@/lib/actions/resource/resource'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/utils/require-role'
import { ResourceItemsTable } from '@/components/resource/ResourceItemsTable'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function ResourcePage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/memory-lane`
	)

	const { items } = await readAllResources()

	return (
		<div className="p-4 space-y-4">
			{/* Header — matches Library */}
			<div className="flex flex-col md:flex-row gap-4 justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t('resource.titles')}</h1>
					<p className="text-sm text-muted-foreground">{t('resource.sub')}</p>
				</div>

				<Link href={`/${locale}/admin/center/resources/create`}>
					<Button variant="default">
						{t('create')} {t('resource.title')}
					</Button>
				</Link>
			</div>

			<ResourceItemsTable items={items} locale={locale} />
		</div>
	)
}
