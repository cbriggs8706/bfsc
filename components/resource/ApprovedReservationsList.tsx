// components/resources/ConfirmedReservationsList.tsx
'use client'

import { ReservationListItem } from '@/types/resource'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
	items: ReservationListItem[]
	timeZone?: string
}

const ASSISTANCE_LABELS: Record<
	ReservationListItem['assistanceLevel'],
	string
> = {
	none: 'No assistance',
	startup: 'Help getting started',
	full: 'Assistance entire time',
}

export function ConfirmedReservationsList({ items, timeZone }: Props) {
	if (items.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No confirmed reservations.
			</p>
		)
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold">Confirmed Reservations</h2>

			{items.map((r) => (
				<Card key={r.id}>
					<CardHeader>
						<div className="font-medium">{r.resourceName}</div>
						<div className="text-sm text-muted-foreground">
							{new Date(r.startTime).toLocaleString(undefined, {
								timeZone,
							})}{' '}
							–{' '}
							{new Date(r.endTime).toLocaleTimeString(undefined, {
								timeZone,
							})}
						</div>
					</CardHeader>

					<CardContent className="space-y-2">
						<div className="text-sm">
							Requested by:{' '}
							<span className="font-medium">
								{r.requestedByName ?? 'Unknown'}
							</span>
						</div>

						{r.resourceType === 'activity' && (
							<div className="text-sm">
								Attendees:{' '}
								<span className="font-medium">{r.attendeeCount}</span>
							</div>
						)}

						<div className="text-sm">
							Assistance:{' '}
							<span className="font-medium">
								{ASSISTANCE_LABELS[r.assistanceLevel]}
							</span>
						</div>

						{r.notes && (
							<p className="text-sm italic text-muted-foreground">
								“{r.notes}”
							</p>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	)
}
