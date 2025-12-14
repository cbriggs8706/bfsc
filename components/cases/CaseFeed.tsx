// components/cases/CaseFeed.tsx
'use client'

import { useRouter } from 'next/navigation'
import { CaseCard } from './CaseCard'

export type CaseItem = {
	id: string
	title: string
	status: string
	updatedAt: Date
	commentCount: number
	submitterName: string
	type: {
		name: string
		icon?: string
		color?: string
	}
}

type Props = {
	items: CaseItem[]
	locale: string
}

export function CaseFeed({ items, locale }: Props) {
	const router = useRouter()

	function handleSelect(id: string) {
		router.push(`/${locale}/cases/${id}`)
	}

	if (items.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
				No cases found.
			</div>
		)
	}

	return (
		<div className="space-y-3 pb-24">
			{items.map((c) => (
				<CaseCard key={c.id} {...c} onClick={() => handleSelect(c.id)} />
			))}
		</div>
	)
}
