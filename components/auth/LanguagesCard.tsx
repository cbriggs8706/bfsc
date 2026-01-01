'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { LanguagesDialog } from './LanguagesDialog'

interface Props {
	kioskPersonId: string
	languages: string[]
	onUpdated: () => void
}

export function LanguagesCard({ kioskPersonId, languages, onUpdated }: Props) {
	const t = useTranslations('auth.languages')
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
					{languages.length > 0 ? (
						<p>{languages.join(', ')}</p>
					) : (
						<p className="text-muted-foreground">{t('none')}</p>
					)}
				</CardContent>
			</Card>

			<LanguagesDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				initialLanguages={languages}
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
