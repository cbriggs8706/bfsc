// components/library/LibraryItemsTable.tsx
'use client'

import type { CurrentUser } from '@/components/classes/ClassesTable'
import {
	LibraryItemsDesktopTable,
	LibraryItemRow,
} from './LibraryItemsDesktopTable'
import { LibraryItemCard } from './LibraryItemCard'

interface Props {
	items: LibraryItemRow[]
	locale: string
	currentUser: CurrentUser | null
}

export function LibraryItemsTable({ items, locale, currentUser }: Props) {
	if (items.length === 0) {
		return <p className="text-muted-foreground">No items found.</p>
	}

	return (
		<>
			<div className="hidden md:block">
				<LibraryItemsDesktopTable
					items={items}
					locale={locale}
					currentUser={currentUser}
				/>
			</div>

			<div className="md:hidden space-y-3">
				{items.map((item) => (
					<LibraryItemCard
						key={item.id}
						item={item}
						locale={locale}
						currentUser={currentUser}
					/>
				))}
			</div>
		</>
	)
}
