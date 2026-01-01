'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import { AvatarDialog } from './AvatarDialog'

interface Props {
	kioskPersonId: string
	name: string | null
	profileImageUrl: string | null
	onUpdated: () => void
}

export function AvatarCard({
	kioskPersonId,
	name,
	profileImageUrl,
	onUpdated,
}: Props) {
	const t = useTranslations('auth.avatar')
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

				<CardContent className="flex items-center gap-4 text-sm md:text-base">
					<Avatar className="h-16 w-16">
						<AvatarImage src={profileImageUrl ?? undefined} />
						<AvatarFallback>
							{name?.charAt(0)?.toUpperCase() ?? 'U'}
						</AvatarFallback>
					</Avatar>

					<div className="text-muted-foreground">{t('hint')}</div>
				</CardContent>
			</Card>

			<AvatarDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
