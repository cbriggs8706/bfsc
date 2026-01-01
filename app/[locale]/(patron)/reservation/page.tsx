// app/[locale]/(patron)/reservation/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'
import { ReservationForm } from '@/components/resource/ReservationForm'
import { db } from '@/db'
import { getFaithTree } from '@/db/queries/faiths'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) {
		redirect(`/${locale}/login?redirect=/${locale}/reservation`)
	}

	const { items } = await readAllResources()
	const resources = items.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

	const settings = await getAppSettings()

	const faithTree = await getFaithTree()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('reservation.requestTitle')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('reservation.requestSub')}
				</p>
			</div>

			<ReservationForm
				locale={locale}
				mode="create"
				resources={resources}
				faithTree={faithTree}
				timeFormat={settings.timeFormat}
				canSetStatus={false}
				successRedirect={`/${locale}/reservation/success`}
			/>
		</div>
	)
}
