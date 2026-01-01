'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { formatPhoneDisplay } from '@/utils/phone'
import { KioskAccessDialog } from './KioskAccessDialog'

interface Props {
	kioskPersonId: string
	phone: string | null
	passcode: string | null
	onUpdated: () => void
}

export function KioskAccessCard({
	kioskPersonId,
	phone,
	passcode,
	onUpdated,
}: Props) {
	const t = useTranslations('auth.kiosk')
	const [open, setOpen] = useState(false)

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base md:text-lg">{t('title')}</CardTitle>
					<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
						{t('edit')}
					</Button>
				</CardHeader>

				<CardContent className="space-y-2 text-sm md:text-base">
					<div>
						<span className="font-medium">{t('phone')}:</span>{' '}
						{phone ? formatPhoneDisplay(phone) : '—'}
					</div>

					<div>
						<span className="font-medium">{t('passcode')}:</span>{' '}
						{passcode ? '••••••' : t('notSet')}
					</div>
				</CardContent>
			</Card>

			<KioskAccessDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				initialPhone={phone}
				initialPasscode={passcode}
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
