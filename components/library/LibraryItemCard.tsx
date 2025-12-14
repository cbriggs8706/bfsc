// components/library/LibraryItemCard.tsx
'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CurrentUser } from '@/components/classes/ClassesTable'
import type { LibraryItemRow } from './LibraryItemsDesktopTable'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
	item: LibraryItemRow
	locale: string
	currentUser: CurrentUser | null
}

export function LibraryItemCard({ item, locale, currentUser }: Props) {
	const router = useRouter()
	const params = useSearchParams()
	const activeTag = params.get('tag')

	const canEdit = currentUser && currentUser.role !== 'Patron'

	function update(key: string, value?: string) {
		const next = new URLSearchParams(params)
		if (!value) next.delete(key)
		else next.set(key, value)
		next.delete('page')
		router.push(`?${next.toString()}`)
	}

	function toggleTag(tag: string) {
		const next = new URLSearchParams(params)

		if (activeTag === tag) {
			next.delete('tag')
		} else {
			next.set('tag', tag)
		}

		next.delete('page')
		router.push(`?${next.toString()}`)
	}

	return (
		<Card className="p-4 space-y-2">
			<div className="font-semibold">{item.name}</div>

			<div className="text-sm text-muted-foreground">
				{item.type === 'book' ? 'Book' : 'Equipment'}
				{item.authorManufacturer && ` • ${item.authorManufacturer}`}
			</div>

			<div className="flex flex-wrap gap-1">
				{item.tags.map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className="cursor-pointer"
						onClick={() => toggleTag(tag)}
					>
						{tag}
					</Badge>
				))}
			</div>

			<div className="flex gap-2 text-sm flex-wrap">
				<Badge variant="outline">Total {item.counts.total}</Badge>
				<Badge className="bg-green-600">Avail {item.counts.available}</Badge>
				<Badge className="bg-amber-500">Out {item.counts.checkedOut}</Badge>
			</div>

			{canEdit && (
				<div className="flex gap-2 pt-2">
					<Button size="sm" variant="outline" asChild>
						<Link href={`/${locale}/library/update/${item.id}`}>Edit</Link>
					</Button>
					<Button size="sm" variant="destructive" asChild>
						<Link href={`/${locale}/library/delete/${item.id}`}>Delete</Link>
					</Button>
				</div>
			)}
		</Card>
	)
}
