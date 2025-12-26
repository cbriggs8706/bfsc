// app/[locale]/admin/resource/delete/[id]/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readResource, deleteResource } from '@/lib/actions/resource/resource'
import { ResourceForm } from '@/components/resource/ResourceForm'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'Admin') {
		redirect(`/${locale}`)
	}

	const resource = await readResource(id)
	if (!resource) redirect(`/${locale}/admin/resource`)

	async function submit() {
		'use server'
		await deleteResource(id)
		redirect(`/${locale}/admin/resource`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold text-destructive">
					{t('delete')} {resource.name}
				</h1>
				<p className="text-sm text-muted-foreground">{t('deleteSub')}</p>
			</div>
			<ResourceForm
				mode="delete"
				initial={{
					...resource,
					type: resource.type as Resource['type'],
				}}
				onSubmit={submit}
				resourceId={resource.id}
				locale={locale}
			/>
		</div>
	)
}
