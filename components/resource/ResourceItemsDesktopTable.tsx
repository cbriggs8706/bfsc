// components/resource/ResourceItemsDesktopTable.tsx
'use client'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Resource } from '@/types/resource'

interface Props {
	items: Resource[]
	locale: string
}

export function ResourceItemsDesktopTable({ items, locale }: Props) {
	return (
		<div className="w-full overflow-x-auto">
			<Table className="w-full table-fixed">
				<TableHeader>
					<TableRow>
						{/* Name grows */}
						<TableHead className="w-auto">Name</TableHead>

						{/* Fixed small columns */}
						<TableHead className="w-20">Duration</TableHead>
						<TableHead className="w-14 text-center">Capacity</TableHead>
						<TableHead className="w-24">Status</TableHead>
						<TableHead className="w-26 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{items.map((r) => (
						<TableRow
							key={r.id}
							className="cursor-pointer hover:bg-muted/50"
							onClick={() =>
								(window.location.href = `/${locale}/admin/center/resources/${r.id}`)
							}
						>
							{/* Name column */}
							<TableCell className="font-medium truncate">{r.name}</TableCell>

							<TableCell>{r.defaultDurationMinutes} min</TableCell>

							<TableCell className="text-center">
								{r.capacity ?? r.maxConcurrent}
							</TableCell>

							<TableCell>{r.isActive ? 'Active' : 'Inactive'}</TableCell>

							<TableCell>
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										asChild
										onClick={(e) => e.stopPropagation()}
									>
										<Link
											href={`/${locale}/admin/center/resources/update/${r.id}`}
										>
											Edit
										</Link>
									</Button>
									<Button
										size="sm"
										variant="destructive"
										asChild
										onClick={(e) => e.stopPropagation()}
									>
										<Link
											href={`/${locale}/admin/center/resources/delete/${r.id}`}
										>
											Delete
										</Link>
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
