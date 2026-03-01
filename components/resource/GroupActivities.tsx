'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
	ReservationDialog,
	type ReservationDialogData,
} from '@/components/resource/ReservationDialog'

type ResourceType = 'equipment' | 'room' | 'booth' | 'activity'

export type GroupActivity = {
	id: string
	name: string
	type: ResourceType
	isActive: boolean
	defaultDurationMinutes: number
	maxConcurrent: number
	capacity: number | null
	description: string | null
	requiredItems: string | null
	prep: string | null
	notes: string | null
	image: string | null
	link: string | null
	video: string | null
}

function isHttpUrl(v: string | null | undefined) {
	if (!v) return false
	try {
		const u = new URL(v)
		return u.protocol === 'http:' || u.protocol === 'https:'
	} catch {
		return false
	}
}

export function GroupActivities({
	items,
	locale,
	reservationData,
	canReserve,
	loginHref,
}: {
	items: GroupActivity[]
	locale: string
	reservationData: ReservationDialogData
	canReserve: boolean
	loginHref: string
}) {
	if (!items.length) {
		return <p className="text-sm text-muted-foreground">No resources found.</p>
	}

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			{items.map((r) => {
				const hasImage = isHttpUrl(r.image)

				const imageBlock = hasImage ? (
					<div className="relative w-full aspect-4/3 lg:h-80 overflow-hidden rounded-2xl">
						<Image
							src={r.image!}
							alt={r.name}
							fill
							sizes="(max-width: 1024px) 100vw, 33vw"
							className="object-cover object-center"
						/>
					</div>
				) : null

				const textBlock = (
					<div className="space-y-4">
						{r.description ? <p>{r.description}</p> : null}
						{r.requiredItems ? <p>{r.requiredItems}</p> : null}
						{r.prep ? <p>{r.prep}</p> : null}
						{r.notes ? <p>{r.notes}</p> : null}

						<div className="flex flex-wrap gap-2">
							<div className="flex flex-col items-start gap-1">
								{canReserve ? (
									<ReservationDialog
										locale={locale}
										resourceId={r.id}
										data={reservationData}
									/>
								) : (
									<Link href={loginHref}>
										<Button>Make A Reservation</Button>
									</Link>
								)}
								<span className="text-xs text-muted-foreground">
									Requires login
								</span>
							</div>

							{isHttpUrl(r.link) ? (
								<Link href={r.link!} target="_blank">
									<Button>More Info</Button>
								</Link>
							) : null}

							{isHttpUrl(r.video) ? (
								<Link href={r.video!} target="_blank">
									<Button variant="secondary">Video</Button>
								</Link>
							) : null}
						</div>
					</div>
				)

				return (
					<Card key={r.id}>
						<CardHeader className="text-xl font-bold">{r.name}</CardHeader>

						<CardContent className="space-y-4">
							{hasImage ? (
								<>
									{imageBlock}
									{textBlock}
								</>
							) : (
								textBlock
							)}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
