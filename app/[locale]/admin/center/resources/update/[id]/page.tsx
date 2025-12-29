// app/[locale]/admin/center/resourcess/update/[id]/page.tsx
import { notFound } from 'next/navigation'
import { readResource } from '@/lib/actions/resource/resource'
import { ResourceForm } from '@/components/resource/ResourceForm'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const resource = await readResource(id)
	if (!resource) {
		notFound()
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">
					{t('update')} {resource.name}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('resource.updateSub')}
				</p>
			</div>
			<ResourceForm
				locale={locale}
				mode="update"
				resourceId={id}
				initialValues={resource}
			/>
		</div>
	)
}
