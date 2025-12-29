// app/[locale]/admin/reservation/update/[id]/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	readReservation,
	updateReservation,
} from '@/lib/actions/resource/reservation'
import { ReservationForm } from '@/components/resource/ReservationForm'
import type { Reservation, Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'

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

	const reservation = await readReservation(id)
	if (!reservation) {
		redirect(`/${locale}/admin/reservation`)
	}

	const { items } = await readAllResources()

	const resources = items.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))
	async function submit(data: Reservation) {
		'use server'
		await updateReservation(id, data)
		redirect(`/${locale}/admin/reservation`)
	}

	const settings = await getAppSettings()
	const timeFormat = settings.timeFormat

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
				mode="update"
				initial={{
					...reservation,
					startTime: new Date(reservation.startTime),
					endTime: new Date(reservation.endTime),
					assistanceLevel:
						reservation.assistanceLevel as Reservation['assistanceLevel'],
					status: reservation.status as Reservation['status'],
				}}
				onSubmit={submit}
				reservationId={reservation.id}
				locale={locale}
				resources={resources}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
