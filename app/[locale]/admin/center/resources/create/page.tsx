// app/[locale]/admin/center/resourcess/create/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createResource } from '@/lib/actions/resource/resource'
import { ResourceForm } from '@/components/resource/ResourceForm'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'Admin') {
		redirect(`/${locale}`)
	}

	async function submit(data: Resource) {
		'use server'
		await createResource(data)
		redirect(`/${locale}/admin/center/resources`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('resource.create')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('resource.createSub')}
				</p>
			</div>
			<ResourceForm mode="create" onSubmit={submit} />
		</div>
	)
}
