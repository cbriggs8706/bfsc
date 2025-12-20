// components/notifications/Notifications.tsx
'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '../ui/card'
import { markNotificationRead } from '@/app/actions/notifications/mark-read'
import { markAllNotificationsRead } from '@/app/actions/notifications/mark-all-read'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'

type Notification = {
	id: string
	message: string
	readAt: Date | null
	createdAt: Date
}

type Props = {
	notifications: Notification[]
}

export function Notifications({ notifications }: Props) {
	const [items, setItems] = useState<Notification[]>(notifications)
	const [, startTransition] = useTransition()

	const unread = items.filter((n) => !n.readAt)
	const read = items.filter((n) => n.readAt)

	if (items.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">No notifications.</div>
		)
	}

	/* --------------------------------
	 * Unread (full card)
	 * -------------------------------- */
	const renderCard = (n: Notification) => {
		const isUnread = !n.readAt

		return (
			<Card
				key={n.id}
				onClick={() => {
					if (!isUnread) return

					// Optimistic UI update
					setItems((prev) =>
						prev.map((item) =>
							item.id === n.id ? { ...item, readAt: new Date() } : item
						)
					)

					// Server update
					startTransition(() => markNotificationRead(n.id))
				}}
				className={cn(
					'transition cursor-pointer',
					isUnread
						? 'border-primary/40 bg-primary/5 hover:shadow-md'
						: 'opacity-60'
				)}
			>
				<CardContent className="p-4 space-y-1">
					<div className="leading-snug">{n.message}</div>
					<div className="text-sm text-muted-foreground">
						{n.createdAt.toLocaleString()}
					</div>
				</CardContent>
			</Card>
		)
	}

	/* --------------------------------
	 * Read (compact log row)
	 * -------------------------------- */
	const renderLogRow = (n: Notification) => (
		<div
			key={n.id}
			className="flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50"
		>
			<span className="line-clamp-2 flex-1">{n.message}</span>
			<span className="shrink-0 whitespace-nowrap">
				{n.createdAt.toLocaleDateString()}
			</span>
		</div>
	)

	return (
		<div className="space-y-6">
			{/* ==============================
			 * NEW / UNREAD
			 * ============================== */}
			{unread.length === 0 && (
				<Card className="p-3">
					<p className="text-muted-foreground">
						You&apos;re all caught up on notifications!
					</p>
				</Card>
			)}
			{unread.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">New</h3>
						<button
							onClick={() => {
								// Optimistic UI update
								setItems((prev) =>
									prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() }))
								)

								// Server update
								startTransition(markAllNotificationsRead)
							}}
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Mark all as read
						</button>
					</div>

					{unread.map(renderCard)}
				</div>
			)}

			{/* ==============================
			 * READ / HISTORY
			 * ============================== */}
			{read.length > 0 && (
				<Collapsible defaultOpen={true}>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-muted-foreground uppercase">
							Notification History
						</h3>
						<CollapsibleTrigger className="text-sm text-muted-foreground hover:text-foreground">
							Show/Hide History
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent>
						<div className="mt-2 space-y-1">{read.map(renderLogRow)}</div>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	)
}
