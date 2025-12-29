'use client'

import { Resource } from '@/types/resource'
import { ResourceItemsDesktopCards } from './ResourceItemsDesktopCards'
import { ResourceItemsMobileList } from './ResourceItemsMobileList'

interface Props {
	items: Resource[]
	locale: string
}

export function ResourceItemsTable({ items, locale }: Props) {
	if (items.length === 0) {
		return <p className="text-muted-foreground">No resources found.</p>
	}

	// ✅ GROUP HERE (single source of truth)
	const grouped = items.reduce<Record<Resource['type'], Resource[]>>(
		(acc, item) => {
			;(acc[item.type] ||= []).push(item)
			return acc
		},
		{
			equipment: [],
			room: [],
			booth: [],
			activity: [],
		}
	)

	return (
		<>
			{/* Desktop: grouped into cards */}
			<div className="hidden md:block">
				<ResourceItemsDesktopCards grouped={grouped} locale={locale} />
			</div>

			{/* Mobile: flat list, sorted by type */}
			<div className="md:hidden">
				<ResourceItemsMobileList items={items} locale={locale} />
			</div>
		</>
	)
}
