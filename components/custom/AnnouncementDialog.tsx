'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'

interface Announcement {
	id: string
	title: string
	body: string
	imageUrl?: string | null
	expiresAt?: Date | null
}

interface AnnouncementDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	announcement: Announcement
}

export function AnnouncementDialog({
	open,
	onOpenChange,
	announcement,
}: AnnouncementDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{announcement.title}</DialogTitle>

					{announcement.expiresAt && (
						<p className="text-xs text-muted-foreground">
							Expires {new Date(announcement.expiresAt).toLocaleDateString()}
						</p>
					)}
				</DialogHeader>

				<div className="space-y-4">
					<p className="whitespace-pre-wrap">{announcement.body}</p>

					{announcement.imageUrl && (
						<div className="relative w-full h-64">
							<Image
								src={announcement.imageUrl}
								alt=""
								fill
								className="object-cover rounded-md"
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
