// app/[locale]/(patron)/reservation/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'
import { PatronReservationClient } from './patron-reservation-client'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}/login?redirect=/${locale}/reservation`)

	const rawResources = await readResources()
	const resources = rawResources.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

	const settings = await getAppSettings()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('reservation.requestTitle')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('reservation.requestSub')}
				</p>
			</div>

			<PatronReservationClient
				locale={locale}
				resources={resources}
				timeFormat={settings.timeFormat}
			/>
		</div>
	)
}
