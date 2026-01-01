'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { AccountDialog } from './AccountDialog'
import { PasswordDialog } from './PasswordDialog'

interface Props {
	details: {
		name: string | null
		username: string | null
		email: string
		role: string
		hasPassword: boolean
	}
	onUpdated: () => void
}

export function AccountCard({ details, onUpdated }: Props) {
	const t = useTranslations('auth.account')
	const [open, setOpen] = useState(false)
	const [passwordOpen, setPasswordOpen] = useState(false)

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
						<span className="font-medium">{t('name')}:</span>{' '}
						{details.name ?? '—'}
					</div>

					<div>
						<span className="font-medium">{t('username')}:</span>{' '}
						{details.username ?? '—'}
					</div>

					<div>
						<span className="font-medium">{t('email')}:</span> {details.email}
					</div>

					<div>
						<span className="font-medium">{t('role')}:</span> {details.role}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setPasswordOpen(true)}
					>
						{details.hasPassword ? t('changePassword') : t('createPassword')}
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
