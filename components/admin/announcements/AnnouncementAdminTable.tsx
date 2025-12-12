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
import type { UIAnnouncement } from '@/db/queries/announcements'

interface Props {
	announcements: UIAnnouncement[]
	locale: string
}

export function AnnouncementAdminTable({ announcements, locale }: Props) {
	return (
		<>
			<div className="flex justify-end">
				<Button asChild>
					<Link href={`/${locale}/admin/announcements/create`}>
						New Announcement
					</Link>
				</Button>
			</div>

			<Table className="mt-4">
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Expires</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{announcements.map((a) => (
						<TableRow key={a.id}>
							<TableCell className="font-medium">{a.title}</TableCell>

							<TableCell>
								{a.expiresAt ? (
									a.expiresAt.toLocaleDateString()
								) : (
									<span className="text-muted-foreground">None</span>
								)}
							</TableCell>

							<TableCell className="text-right space-x-2">
								<Button variant="ghost" size="sm" asChild>
									<Link href={`/${locale}/admin/announcements/read/${a.id}`}>
										View
									</Link>
								</Button>

								<Button variant="outline" size="sm" asChild>
									<Link href={`/${locale}/admin/announcements/update/${a.id}`}>
										Edit
									</Link>
								</Button>

								<Button variant="destructive" size="sm" asChild>
									<Link href={`/${locale}/admin/announcements/delete/${a.id}`}>
										Delete
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	)
}
