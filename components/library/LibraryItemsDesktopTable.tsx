// components/library/LibraryItemsDesktopTable.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { CurrentUser } from '@/components/classes/ClassesTable'
import { Card } from '../ui/card'

export type LibraryItemRow = {
	id: string
	name: string
	type: 'book' | 'equipment'
	authorManufacturer: string | null
	tags: string[]
	counts: {
		total: number
		available: number
		checkedOut: number
	}
}

interface Props {
	items: LibraryItemRow[]
	locale: string
	currentUser: CurrentUser | null
}

function canEdit(user: CurrentUser | null) {
	return Boolean(user && user.role !== 'Patron')
}

export function LibraryItemsDesktopTable({
	items,
	locale,
	currentUser,
}: Props) {
	return (
		<Card className="p-6">
			<Table className="">
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Tags</TableHead>
						<TableHead>Inventory</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{items.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="font-medium">
								{item.name}
								{item.authorManufacturer && (
									<div className="text-sm text-muted-foreground">
										{item.authorManufacturer}
									</div>
								)}
							</TableCell>

							<TableCell>
								{item.type === 'book' ? 'Book' : 'Equipment'}
							</TableCell>

							<TableCell>
								<div className="flex flex-wrap gap-1">
									{item.tags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="cursor-pointer"
											onClick={() => {
												const params = new URLSearchParams(
													window.location.search
												)
												params.set('tag', tag)
												params.delete('page')
												window.location.search = params.toString()
											}}
										>
											{tag}
										</Badge>
									))}
								</div>
							</TableCell>

							<TableCell>
								<div className="flex gap-2 flex-wrap">
									<Badge variant="outline">Total {item.counts.total}</Badge>
									<Badge className="bg-(--green-logo)">
										Avail {item.counts.available}
									</Badge>
									<Badge className="bg-(--orange-accent)">
										Out {item.counts.checkedOut}
									</Badge>
								</div>
							</TableCell>

							<TableCell className="text-right space-x-2">
								{canEdit(currentUser) && (
									<>
										<Button size="sm" variant="outline" asChild>
											<Link href={`/${locale}/library/update/${item.id}`}>
												Edit
											</Link>
										</Button>
										<Button size="sm" variant="destructive" asChild>
											<Link href={`/${locale}/library/delete/${item.id}`}>
												Delete
											</Link>
										</Button>
									</>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Card>
	)
}
