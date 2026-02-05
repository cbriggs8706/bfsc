'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { SpecialtiesDialog } from './SpecialtiesDialog'

interface Props {
	kioskPersonId: string
	specialties: string[]
	onUpdated: () => void
}

export function SpecialtiesCard({
	kioskPersonId,
	specialties,
	onUpdated,
}: Props) {
	const t = useTranslations('auth.specialties')
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
					{specialties.length > 0 ? (
						<ul className="list-disc pl-5 space-y-1">
							{specialties.map((specialty) => (
								<li key={specialty}>{specialty}</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground">{t('none')}</p>
					)}
				</CardContent>
			</Card>

			<SpecialtiesDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				initialSpecialties={specialties}
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
