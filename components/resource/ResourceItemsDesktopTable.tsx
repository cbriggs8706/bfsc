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
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Duration</TableHead>
					<TableHead>Capacity</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{items.map((r) => (
					<TableRow
						key={r.id}
						className="cursor-pointer hover:bg-muted/50"
						onClick={() => {
							window.location.href = `/${locale}/admin/center/resources/${r.id}`
						}}
					>
						<TableCell className="font-medium">{r.name}</TableCell>
						<TableCell>{r.defaultDurationMinutes} min</TableCell>
						<TableCell>{r.capacity ?? r.maxConcurrent}</TableCell>
						<TableCell>{r.isActive ? 'Active' : 'Inactive'}</TableCell>
						<TableCell className="text-right space-x-2">
							<Button size="sm" asChild onClick={(e) => e.stopPropagation()}>
								<Link href={`/${locale}/admin/center/resources/update/${r.id}`}>
									Edit
								</Link>
							</Button>
							<Button
								size="sm"
								variant="destructive"
								asChild
								onClick={(e) => e.stopPropagation()}
							>
								<Link href={`/${locale}/admin/center/resources/delete/${r.id}`}>
									Delete
								</Link>
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
