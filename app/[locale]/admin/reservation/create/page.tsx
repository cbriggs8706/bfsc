// app/[locale]/admin/reservation/create/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createReservation } from '@/lib/actions/resource/reservation'
import { ReservationForm } from '@/components/resource/ReservationForm'
import type { Reservation, Resource } from '@/types/resource'
import { getTranslations } from 'next-intl/server'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAppSettings } from '@/lib/actions/app-settings'

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

	async function submit(data: Reservation) {
		'use server'
		await createReservation(data)
		redirect(`/${locale}/admin/reservation`)
	}

	const { items } = await readAllResources()

	const resources = items.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

	const settings = await getAppSettings()
	const timeFormat = settings.timeFormat

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
				mode="create"
				onSubmit={submit}
				resources={resources}
				timeFormat={timeFormat}
				canSetStatus
			/>
		</div>
	)
}
