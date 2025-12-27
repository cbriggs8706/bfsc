// components/resource/PatronReservationForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ReservationForm } from '@/components/resource/ReservationForm'
import { createReservation } from '@/lib/actions/resource/reservation'
import type { Reservation, Resource } from '@/types/resource'
import { useTranslations } from 'next-intl'
import { TimeFormat } from '@/types/shifts'
import { getErrorMessage } from '@/utils/errors'

type Props = {
	locale: string
	resources: Resource[]
	timeFormat: TimeFormat
}

export function PatronReservationForm({
	locale,
	resources,
	timeFormat,
}: Props) {
	const router = useRouter()
	const t = useTranslations('common')

	async function submit(data: Reservation) {
		try {
			const res = await createReservation(data)

			if (res.ok) {
				toast.success(t('reservation.requestSuccess'), {
					description: t('reservation.requestSuccessSub'),
					duration: Infinity,
					action: {
						label: t('close'),
						onClick: () => {},
					},
				})

				router.push(`/${locale}/reservation`)
			}
		} catch (err: unknown) {
			toast.error(t('error'), {
				description: getErrorMessage(err),
			})
		}
	}

	return (
		<ReservationForm
			mode="create"
			onSubmit={submit}
			resources={resources}
			timeFormat={timeFormat}
			canSetStatus={false}
		/>
	)
}
