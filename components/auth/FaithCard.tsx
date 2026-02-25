'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { FaithDialog } from './FaithDialog'
import { Faith } from '@/types/faiths'

interface Props {
	kioskPersonId: string
	faithTree: Faith[]
	faithId: string | null
	wardId: string | null
	onUpdated: () => void
}

export function FaithCard({
	kioskPersonId,
	faithTree,
	faithId,
	wardId,
	onUpdated,
}: Props) {
	const t = useTranslations('auth.faith')
	const [open, setOpen] = useState(false)

	const selectedFaith = faithTree.find((f) => f.id === faithId)
	const selectedStake = selectedFaith?.stakes.find((s) =>
		s.wards.some((w) => w.id === wardId)
	)
	const wardName = selectedStake?.wards.find((w) => w.id === wardId)?.name ?? '—'
	const wardWithStake =
		wardName === '—'
			? wardName
			: selectedStake?.name
				? `${wardName} (${selectedStake.name})`
				: wardName

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
						<span className="font-medium">{t('faith')}:</span>{' '}
						{selectedFaith?.name ?? '—'}
					</div>

					<div>
						<span className="font-medium">{t('ward')}:</span> {wardWithStake}
					</div>
				</CardContent>
			</Card>

			<FaithDialog
				open={open}
				onOpenChange={setOpen}
				kioskPersonId={kioskPersonId}
				faithTree={faithTree}
				initialFaithId={faithId}
				initialWardId={wardId}
				onSaved={() => {
					setOpen(false)
					onUpdated()
				}}
			/>
		</>
	)
}
