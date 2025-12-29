// components/resource/ResourceItemsMobileList.tsx
'use client'

import { Resource } from '@/types/resource'
import { ResourceItemCard } from './ResourceItemCard'

interface Props {
	items: Resource[]
	locale: string
}

export function ResourceItemsMobileList({ items, locale }: Props) {
	const order: Resource['type'][] = ['equipment', 'room', 'booth', 'activity']

	const sorted = [...items].sort(
		(a, b) => order.indexOf(a.type) - order.indexOf(b.type)
	)

	return (
		<div className="space-y-3">
			{sorted.map((item) => (
				<ResourceItemCard key={item.id} item={item} locale={locale} />
			))}
		</div>
	)
}
