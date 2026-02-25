'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { SPECIALTY_OPTIONS, SpecialtiesDialog } from './SpecialtiesDialog'

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
	const normalizedSpecialties = useMemo(() => {
		const map = new Map<string, string>()
		for (const value of specialties) {
			const trimmed = value.trim()
			if (!trimmed) continue
			const key = trimmed.toLowerCase()
			if (!map.has(key)) map.set(key, trimmed)
		}
		return Array.from(map.values())
	}, [specialties])

	const groupedSpecialties = useMemo(() => {
		const optionToCategory = new Map<string, string>()
		for (const group of SPECIALTY_OPTIONS) {
			for (const option of group.specialties) {
				optionToCategory.set(option.toLowerCase(), group.category)
			}
		}

		const grouped = new Map<string, string[]>()
		const uncategorized: string[] = []

		for (const specialty of normalizedSpecialties) {
			const category = optionToCategory.get(specialty.toLowerCase())
			if (!category) {
				uncategorized.push(specialty)
				continue
			}

			if (!grouped.has(category)) grouped.set(category, [])
			grouped.get(category)!.push(specialty)
		}

		return {
			grouped,
			uncategorized,
		}
	}, [normalizedSpecialties])

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
					{normalizedSpecialties.length > 0 ? (
						<div className="space-y-4">
							{SPECIALTY_OPTIONS.map((group) => {
								const items = groupedSpecialties.grouped.get(group.category) ?? []
								if (items.length === 0) return null

								return (
									<div key={group.category}>
										<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											{group.category}
										</p>
										<ul className="list-disc pl-5 space-y-1">
											{items.map((specialty) => (
												<li key={specialty}>{specialty}</li>
											))}
										</ul>
									</div>
								)
							})}

							{groupedSpecialties.uncategorized.length > 0 && (
								<div>
									<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('customLabel')}
									</p>
									<ul className="list-disc pl-5 space-y-1">
										{groupedSpecialties.uncategorized.map((specialty) => (
											<li key={specialty}>{specialty}</li>
										))}
									</ul>
								</div>
							)}
						</div>
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
