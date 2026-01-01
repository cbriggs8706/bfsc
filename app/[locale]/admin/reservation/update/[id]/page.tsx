// app/[locale]/admin/reservation/update/[id]/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { readReservationForForm } from '@/lib/actions/resource/reservation'

import { ReservationForm } from '@/components/resource/ReservationForm'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'
import type { Resource } from '@/types/resource'
import { getFaithTree } from '@/db/queries/faiths'

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

	// ✅ FORM-SHAPED READ
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
				<h1 className="text-3xl font-bold">
					{t('update')} {t('reservation.title')}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('reservation.updateSub')}
				</p>
			</div>

			<ReservationForm
				locale={locale}
				mode="update"
				reservationId={reservation.id}
				initialValues={reservation}
				resources={resources}
				faithTree={faithTree}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
