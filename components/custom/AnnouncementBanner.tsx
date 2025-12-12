'use client'

import { useState } from 'react'
import { AnnouncementDialog } from './AnnouncementDialog'
import { Megaphone } from 'lucide-react'

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
				className="w-full bg-accent outline-green-accent outline-2 p-3 rounded-md cursor-pointer hover:bg-green-accent transition flex items-center gap-2"
				onClick={() => setOpen(true)}
			>
				<Megaphone className="h-5 w-5 shrink-0 " />

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
