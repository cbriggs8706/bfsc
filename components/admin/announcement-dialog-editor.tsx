'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { EditAnnouncementForm } from './edit-announcement-form'
import { Role } from '@/types/announcements'

interface AnnouncementDialogEditorProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	announcement: {
		id: string
		title: string
		body: string
		roles: Role[]
		imageUrl?: string | null
		expiresAt?: string | null
	}
}

export function AnnouncementDialogEditor({
	open,
	onOpenChange,
	announcement,
}: AnnouncementDialogEditorProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Announcement</DialogTitle>
				</DialogHeader>

				<EditAnnouncementForm
					announcement={announcement}
					onUpdated={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}
