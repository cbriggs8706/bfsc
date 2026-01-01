'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { PidDialog } from './PidDialog'

interface Props {
	kioskPersonId: string
	pid?: string // 🔹 undefined, not null
	onUpdated: () => void
}

export function PidCard({ kioskPersonId, pid, onUpdated }: Props) {
	const t = useTranslations('auth.pid')
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

				<CardContent className="text-sm md:text-base">
					{pid ? (
						<p className="font-mono tracking-wide">{pid}</p>
					) : (
						<p className="text-muted-foreground">{t('notSet')}</p>
					)}
				</CardContent>
			</Card>

			<PidDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				initialPid={pid ?? ''} // 🔹 normalize here
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
