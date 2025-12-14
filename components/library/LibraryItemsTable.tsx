// components/library/LibraryItemsTable.tsx
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

type LibraryItemRow = {
	id: string
	name: string
	type: 'book' | 'equipment'
	authorManufacturer: string | null
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

function canEditLibraryItem(user: CurrentUser | null): boolean {
	if (!user) return false
	if (user.role === 'Patron') return false
	return true // Admin, Director, etc.
}

export function LibraryItemsTable({ items, locale, currentUser }: Props) {
	return (
		<>
			<div className="flex justify-end">
				{currentUser && currentUser.role !== 'Patron' && (
					<Button asChild>
						<Link href={`/${locale}/library/create`}>New Item</Link>
					</Button>
				)}
			</div>

			<Table className="mt-4">
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Inventory</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{items.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={4}
								className="text-muted-foreground text-center"
							>
								No items in inventory yet.
							</TableCell>
						</TableRow>
					)}

					{items.map((item) => {
						const editable = canEditLibraryItem(currentUser)

						return (
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
									<div className="flex gap-2 flex-wrap">
										<Badge variant="outline">Total: {item.counts.total}</Badge>
										<Badge className="bg-green-600">
											Available: {item.counts.available}
										</Badge>
										<Badge className="bg-amber-500">
											Out: {item.counts.checkedOut}
										</Badge>
									</div>
								</TableCell>

								<TableCell className="text-right space-x-2">
									{editable && (
										<>
											<Button variant="outline" size="sm" asChild>
												<Link href={`/${locale}/library/update/${item.id}`}>
													Edit
												</Link>
											</Button>

											<Button variant="destructive" size="sm" asChild>
												<Link href={`/${locale}/library/delete/${item.id}`}>
													Delete
												</Link>
											</Button>
										</>
									)}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</>
	)
}
