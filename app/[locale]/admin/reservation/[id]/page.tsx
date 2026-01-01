// app/[locale]/admin/reservation/[id]/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readReservationForForm } from '@/lib/actions/resource/reservation'
import { ReservationForm } from '@/components/resource/ReservationForm'
import type { Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'
import { getFaithTree } from '@/db/queries/faiths'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const reservation = await readReservationForForm(id)
	if (!reservation) {
		redirect(`/${locale}/admin/reservation`)
	}
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
				<h1 className="text-3xl font-bold">{t('reservation.title')}</h1>
				<p className="text-sm text-muted-foreground"></p>
			</div>

			<ReservationForm
				mode="read"
				initialValues={reservation}
				reservationId={reservation.id}
				locale={locale}
				resources={resources}
				faithTree={faithTree}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
