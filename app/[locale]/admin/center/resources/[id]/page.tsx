// app/[locale]/admin/center/resources/update/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readResource } from '@/lib/actions/resource/resource'
import { ResourceForm } from '@/components/resource/ResourceForm'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const resource = await readResource(id)
	if (!resource) notFound()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{resource.name}</h1>
				<p className="text-sm text-muted-foreground">{t('resource.readSub')}</p>
			</div>
			<ResourceForm
				locale={locale}
				mode="read"
				resourceId={id}
				initialValues={resource}
			/>
		</div>
	)
}
