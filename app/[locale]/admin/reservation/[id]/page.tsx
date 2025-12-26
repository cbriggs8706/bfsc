// app/[locale]/admin/reservation/update/[id]/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readReservation } from '@/lib/actions/resource/reservation'
import { ReservationForm } from '@/components/resource/ReservationForm'
import type { ReservationWithUser, Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function Page({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const reservation = await readReservation(id)
	if (!reservation) redirect(`/${locale}/admin/reservation`)

	const rawResources = await readResources()

	const resources = rawResources.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))
	const settings = await getAppSettings()
	const timeFormat = settings.timeFormat

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('reservation.title')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('requestedBy')}: {reservation.user.name ?? reservation.user.email}
				</p>
			</div>

			<ReservationForm
				mode="read"
				initial={{
					...reservation,
					startTime: new Date(reservation.startTime),
					endTime: new Date(reservation.endTime),
					assistanceLevel:
						reservation.assistanceLevel as ReservationWithUser['assistanceLevel'],
					status: reservation.status as ReservationWithUser['status'],
				}}
				reservationId={reservation.id}
				locale={locale}
				resources={resources}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
