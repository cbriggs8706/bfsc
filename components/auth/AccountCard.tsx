'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { AccountDialog } from './AccountDialog'
import { PasswordDialog } from './PasswordDialog'
import { formatPhoneInternational } from '@/utils/phone'

interface Props {
	details: {
		name: string | null
		username: string | null
		email: string
		phone?: string | null
		hasPassword: boolean
	}
	onUpdated: () => void
}

export function AccountCard({ details, onUpdated }: Props) {
	const t = useTranslations('auth')
	const [open, setOpen] = useState(false)
	const [passwordOpen, setPasswordOpen] = useState(false)

	return (
		<>
			<Card>
					<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base md:text-lg">
						{t('account.title')}
					</CardTitle>
					<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
						{t('account.edit')}
					</Button>
				</CardHeader>

				<CardContent className="space-y-4 text-sm md:text-base">
					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('account.name')}:</span>
						<span>{details.name ?? '—'}</span>
					</div>

					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('account.username')}:</span>
						<span>{details.username ?? '—'}</span>
					</div>

					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('account.email')}:</span>
						<span className="break-all">{details.email}</span>
					</div>

					<div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-baseline">
						<span className="font-medium">{t('account.phone')}:</span>
						<span>
							{details.phone ? formatPhoneInternational(details.phone) : '—'}
						</span>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setPasswordOpen(true)}
					>
						{details.hasPassword
							? t('account.changePassword')
							: t('account.createPassword')}
					</Button>
				</CardContent>
			</Card>

			<AccountDialog
				open={open}
				onOpenChange={setOpen}
				details={details}
				onUpdated={onUpdated}
			/>

			<PasswordDialog
				open={passwordOpen}
				onOpenChange={setPasswordOpen}
				hasPassword={details.hasPassword}
				onUpdated={onUpdated}
			/>
		</>
	)
}
