// components/resource/ReservationDialog.tsx
'use client'

import { useTranslations } from 'next-intl'

import { ReservationForm } from '@/components/resource/ReservationForm'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import type { Faith } from '@/types/faiths'
import type { Resource } from '@/types/resource'
import type { TimeFormat } from '@/types/shifts'

export type ReservationDialogData = {
	resources: Resource[]
	faithTree: Faith[]
	timeFormat: TimeFormat
}

type Props = {
	locale: string
	resourceId?: string
	data: ReservationDialogData
	buttonLabel?: string
}

export function ReservationDialog({
	locale,
	resourceId,
	data,
	buttonLabel = 'Make A Reservation',
}: Props) {
	const t = useTranslations('common')

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>{buttonLabel}</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t('reservation.requestTitle')}</DialogTitle>
					<DialogDescription>{t('reservation.requestSub')}</DialogDescription>
				</DialogHeader>

				<ReservationForm
					locale={locale}
					mode="create"
					resources={data.resources}
					faithTree={data.faithTree}
					timeFormat={data.timeFormat}
					canSetStatus={false}
					initialValues={resourceId ? { resourceId } : undefined}
					successRedirect={`/${locale}/reservation/success`}
				/>
			</DialogContent>
		</Dialog>
	)
}
