// app/[locale]/admin/reservation/update/[id]/page.tsx
import { redirect } from 'next/navigation'
import { readReservationForForm } from '@/lib/actions/resource/reservation'
import { ReservationForm } from '@/components/resource/ReservationForm'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import type { Resource } from '@/types/resource'
import { getFaithTree } from '@/db/queries/faiths'
import { requireRole } from '@/utils/require-role'
import { getCenterTimeConfig } from '@/lib/time/center-time'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director', 'Shift Lead'],
		`/${locale}/dashboard`
	)

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

	const centerTime = await getCenterTimeConfig()
	const timeFormat = centerTime.timeFormat
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
