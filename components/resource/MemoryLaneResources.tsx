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

export type MemoryLaneResource = {
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

export function MemoryLaneResources({
	items,
	locale,
	reservationData,
	canReserve,
	loginHref,
}: {
	items: MemoryLaneResource[]
	locale: string
	reservationData: ReservationDialogData
	canReserve: boolean
	loginHref: string
}) {
	if (!items.length) {
		return <p className="text-sm text-muted-foreground">No resources found.</p>
	}

	return (
		<div className="space-y-6">
			{items.map((r, idx) => {
				const hasImage = isHttpUrl(r.image)
				const imageOnLeftLg = idx % 2 === 1 // alternate only on lg+

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

						<CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
							{hasImage ? (
								<>
									{/* Mobile: image first.  Desktop (lg+): alternate via lg:order */}
									<div
										className={[
											'order-1 lg:col-span-1',
											imageOnLeftLg ? 'lg:order-1' : 'lg:order-2',
										].join(' ')}
									>
										{imageBlock}
									</div>

									<div
										className={[
											'order-2 lg:col-span-2',
											imageOnLeftLg ? 'lg:order-2' : 'lg:order-1',
										].join(' ')}
									>
										{textBlock}
									</div>
								</>
							) : (
								<div className="lg:col-span-3">{textBlock}</div>
							)}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
