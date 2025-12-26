// components/resources/ReservationInbox.tsx
'use client'

import { reviewReservation } from '@/app/actions/resource/review-reservation'
import { Button } from '@/components/ui/button'
import { ReservationListItem } from '@/types/resource'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/card'

type Props = {
	items: ReservationListItem[]
}

const ASSISTANCE_LABELS: Record<
	ReservationListItem['assistanceLevel'],
	string
> = {
	none: 'No assistance',
	startup: 'Help getting started',
	full: 'Assistance entire time',
}

export function ReservationInbox({ items }: Props) {
	const [loadingId, setLoadingId] = useState<string | null>(null)

	async function handleAction(id: string, action: 'approve' | 'deny') {
		setLoadingId(id)
		await reviewReservation({ reservationId: id, action })
		setLoadingId(null)
	}

	if (items.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No pending reservation requests.
			</p>
		)
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold">Pending Requests</h2>
			{items.map((r) => (
				<Card key={r.id} className="">
					{/* Header */}
					<CardHeader className="flex justify-between items-start">
						<div>
							<div className="font-medium">{r.resourceName}</div>
							<div className="text-sm text-muted-foreground">
								{new Date(r.startTime).toLocaleString()} –{' '}
								{new Date(r.endTime).toLocaleTimeString()}
							</div>
						</div>

						{r.isClosedDayRequest && (
							<span className="text-xs rounded bg-yellow-100 text-yellow-800 px-2 py-0.5">
								Closed day
							</span>
						)}
					</CardHeader>
					<CardContent>
						{/* Requester */}
						<div className="text-sm">
							Requested by:{' '}
							<span className="font-medium">
								{r.requestedByName ?? 'Unknown'}
							</span>
						</div>

						{/* Activity-specific info */}
						{r.resourceType === 'activity' && (
							<div className="text-sm space-y-1">
								<div>
									Attendees:{' '}
									<span className="font-medium">{r.attendeeCount}</span>
								</div>
							</div>
						)}
						<div>
							Assistance:{' '}
							<span className="font-medium">
								{ASSISTANCE_LABELS[r.assistanceLevel]}
							</span>
						</div>
						{/* Notes */}
						{r.notes && (
							<p className="text-sm italic text-muted-foreground">
								“{r.notes}”
							</p>
						)}

						{/* Actions */}
						<div className="flex gap-2 pt-2">
							<Button
								size="sm"
								onClick={() => handleAction(r.id, 'approve')}
								disabled={loadingId === r.id}
							>
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleAction(r.id, 'deny')}
								disabled={loadingId === r.id}
							>
								Deny
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
