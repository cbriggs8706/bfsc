'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { AnnouncementDialogEditor } from './announcement-dialog-editor'
import { AnnouncementCreateDialog } from './announcement-create-dialog'
import { deleteAnnouncement } from '@/app/actions/announcements'
import { Trash2, SquarePen } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Role } from '@/types/announcements'

interface Announcement {
	id: string
	title: string
	body: string
	roles: Role[]
	imageUrl?: string | null
	expiresAt?: Date | null
	createdAt: Date
}

interface Props {
	announcements: Announcement[]
}

export function AnnouncementAdminTable({ announcements }: Props) {
	const [editing, setEditing] = useState<Announcement | null>(null)
	const [deleting, setDeleting] = useState<Announcement | null>(null)
	const [showCreate, setShowCreate] = useState(false)

	const handleDelete = async () => {
		if (!deleting) return
		await deleteAnnouncement(deleting.id)
		toast.success('Announcement deleted.')
		setDeleting(null)
	}

	return (
		<>
			<div className="flex justify-end">
				<Button onClick={() => setShowCreate(true)}>New Announcement</Button>
			</div>

			<Table className="mt-4">
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Roles</TableHead>
						<TableHead>Expires</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{announcements.map((a) => (
						<TableRow key={a.id}>
							<TableCell className="font-medium">{a.title}</TableCell>

							{/* Roles */}
							<TableCell className="space-x-2">
								{a.roles.map((role) => (
									<Badge key={role} variant="secondary">
										{role}
									</Badge>
								))}
							</TableCell>

							{/* Expiration */}
							<TableCell>
								{a.expiresAt ? (
									new Date(a.expiresAt).toLocaleDateString()
								) : (
									<span className="text-muted-foreground">None</span>
								)}
							</TableCell>

							{/* Created */}
							<TableCell>
								{new Date(a.createdAt).toLocaleDateString()}
							</TableCell>

							{/* Actions */}
							<TableCell className="text-right space-x-2">
								<Button
									variant="outline"
									size="icon"
									onClick={() => setEditing(a)}
								>
									<SquarePen className="w-4 h-4" />
								</Button>

								<Button
									variant="destructive"
									size="icon"
									onClick={() => setDeleting(a)}
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{editing && (
				<AnnouncementDialogEditor
					announcement={editing}
					open={Boolean(editing)}
					onOpenChange={(open: boolean) => {
						if (!open) setEditing(null)
					}}
				/>
			)}

			<AnnouncementCreateDialog
				open={showCreate}
				onOpenChange={setShowCreate}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={Boolean(deleting)}
				onOpenChange={() => setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
