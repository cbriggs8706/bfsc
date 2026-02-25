'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { KioskAccessDialog } from './KioskAccessDialog'
import type { CountryCode } from 'libphonenumber-js'

interface Props {
	kioskPersonId: string
	phone: string | null
	passcode: string | null
	role: string
	onUpdated: () => void
	countryCode: CountryCode
}

export function KioskAccessCard({
	kioskPersonId,
	phone,
	passcode,
	role,
	onUpdated,
	countryCode,
}: Props) {
	const t = useTranslations('auth')
	const [open, setOpen] = useState(false)

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base md:text-lg">
						{t('kiosk.title')}
					</CardTitle>
					<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
						{t('kiosk.edit')}
					</Button>
				</CardHeader>

				<CardContent className="space-y-4 text-sm md:text-base">
					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('kiosk.role')}:</span>
						<span>{role}</span>
					</div>

					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('kiosk.passcode')}:</span>
						<span>{passcode ? '••••••' : t('kiosk.notSet')}</span>
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
				countryCode={countryCode}
			/>
		</>
	)
}
