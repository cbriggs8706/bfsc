// components/classes/ClassesTable.tsx

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
import type { UISeriesTableRow } from '@/db/queries/classes'
import { format } from 'date-fns'

type CurrentUser = {
	id: string
	role: string
}

interface Props {
	classes: UISeriesTableRow[]
	locale: string
	currentUser: CurrentUser | null
}

function canEditClass(c: UISeriesTableRow, user: CurrentUser | null): boolean {
	if (!user) return false
	if (user.role === 'Admin') return true
	if (user.role === 'Patron') return false
	return c.createdByUserId === user.id
}

export function ClassesTable({ classes, locale, currentUser }: Props) {
	return (
		<>
			<div className="flex justify-end">
				{currentUser && currentUser.role !== 'Patron' && (
					<Button asChild>
						<Link href={`/${locale}/classes/create`}>New Class</Link>
					</Button>
				)}
			</div>

			<Table className="mt-4">
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Starts</TableHead>
						<TableHead>Presenters</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{classes.map((c) => {
						const editable = canEditClass(c, currentUser)

						return (
							<TableRow key={c.id}>
								<TableCell className="font-medium">{c.title}</TableCell>

								<TableCell>
									{c.status === 'published' ? (
										<Badge variant="secondary">Published</Badge>
									) : (
										<Badge variant="outline">Draft</Badge>
									)}
								</TableCell>

								<TableCell>
									{c.startsAt ? (
										format(c.startsAt, 'MMM d, yyyy')
									) : (
										<span className="text-muted-foreground">Not scheduled</span>
									)}
								</TableCell>

								<TableCell>
									{c.presenters.length > 0 ? (
										<span className="text-sm">{c.presenters.join(', ')}</span>
									) : (
										<span className="text-muted-foreground">None</span>
									)}
								</TableCell>

								<TableCell className="text-right space-x-2">
									{canEditClass(c, currentUser) && (
										<>
											<Button variant="outline" size="sm" asChild>
												<Link href={`/${locale}/classes/update/${c.id}`}>
													Edit
												</Link>
											</Button>

											<Button variant="destructive" size="sm" asChild>
												<Link href={`/${locale}/classes/delete/${c.id}`}>
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
