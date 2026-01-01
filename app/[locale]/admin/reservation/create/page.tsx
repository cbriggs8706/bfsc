// app/[locale]/admin/reservation/create/page.tsx
import { ReservationForm } from '@/components/resource/ReservationForm'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'
import { getFaithTree } from '@/db/queries/faiths'
import { requireRole } from '@/utils/require-role'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director', 'Shift Lead'],
		`/${locale}/dashboard`
	)

	const { items } = await readAllResources()

	const resources = items.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

	const settings = await getAppSettings()
	const timeFormat = settings.timeFormat
	const faithTree = await getFaithTree()
	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">
					{t('create')} {t('reservation.title')}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('reservation.createSub')}
				</p>
			</div>
			<ReservationForm
				locale={locale}
				mode="create"
				resources={resources}
				faithTree={faithTree}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
