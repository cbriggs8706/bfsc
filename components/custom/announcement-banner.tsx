'use client'

import { useState } from 'react'
import { AnnouncementDialog } from './announcement-dialog'

interface Announcement {
	id: string
	title: string
	body: string
	imageUrl?: string | null
	expiresAt?: Date | null
	roles?: string[]
}

interface AnnouncementBannerProps {
	announcement: Announcement
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
	const [open, setOpen] = useState(false)

	return (
		<>
			<div
				className="w-full bg-accent outline-green-accent outline-2  p-3 rounded-md cursor-pointer hover:bg-green-accent transition"
				onClick={() => setOpen(true)}
			>
				<span className="font-semibold">{announcement.title}</span>
			</div>

			<AnnouncementDialog
				open={open}
				onOpenChange={setOpen}
				announcement={announcement}
			/>
		</>
	)
}
