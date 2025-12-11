'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { CreateAnnouncementForm } from './create-announcement-form'

interface AnnouncementCreateDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function AnnouncementCreateDialog({
	open,
	onOpenChange,
}: AnnouncementCreateDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create Announcement</DialogTitle>
				</DialogHeader>

				<CreateAnnouncementForm onCreated={() => onOpenChange(false)} />
			</DialogContent>
		</Dialog>
	)
}
