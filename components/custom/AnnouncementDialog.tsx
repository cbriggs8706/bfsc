'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

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

function AnnouncementImage({ src }: { src: string }) {
	const [imageLoading, setImageLoading] = useState(true)

	return (
		<div className="relative w-full overflow-hidden rounded-md bg-muted min-h-40">
			{imageLoading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80">
					<Spinner className="size-6 text-muted-foreground" />
				</div>
			)}
			<img
				src={src}
				alt=""
				className="block h-auto w-full rounded-md"
				onLoad={() => setImageLoading(false)}
				onError={() => setImageLoading(false)}
			/>
		</div>
	)
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
						<AnnouncementImage
							key={announcement.imageUrl}
							src={announcement.imageUrl}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
