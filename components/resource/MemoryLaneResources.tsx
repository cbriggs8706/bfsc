'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
}: {
	items: MemoryLaneResource[]
	locale: string
}) {
	if (!items.length) {
		return <p className="text-sm text-muted-foreground">No resources found.</p>
	}

	return (
		<div className="space-y-6">
			{items.map((r, idx) => {
				const imageOnLeft = idx % 2 === 1
				const hasImage = isHttpUrl(r.image)

				const imageBlock = (
					<div className="relative w-full h-96 flex items-center justify-center">
						{hasImage ? (
							<Image
								src={r.image!}
								alt={r.name}
								fill
								sizes="(max-width: 1024px) 100vw, 33vw"
								className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
							/>
						) : (
							<div className="w-full h-full rounded-2xl border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
								No image
							</div>
						)}
					</div>
				)

				const textBlock = (
					<div className="col-span-1 lg:col-span-2 space-y-4">
						{r.description ? <p>{r.description}</p> : null}
						{r.requiredItems ? <p>{r.requiredItems}</p> : null}
						{r.prep ? <p>{r.prep}</p> : null}
						{r.notes ? <p>{r.notes}</p> : null}

						<div className="flex flex-wrap gap-2">
							<Link href={`/${locale}/reservation?resourceId=${r.id}`}>
								<Button>Make A Reservation</Button>
							</Link>
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
						<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
							{imageOnLeft ? (
								<>
									{imageBlock}
									{textBlock}
								</>
							) : (
								<>
									{textBlock}
									{imageBlock}
								</>
							)}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
