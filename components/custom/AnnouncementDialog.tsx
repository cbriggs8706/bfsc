'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

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
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
						<div className="w-full">
							<img
								src={announcement.imageUrl}
								alt=""
								className="block w-full h-auto rounded-md"
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
