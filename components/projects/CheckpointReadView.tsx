'use client'

import { useRouter } from 'next/navigation'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

type Props = {
	projectId: string
	locale: string
	checkpoint: {
		id: string
		name: string
		notes: string
		url: string
		isCompleted: boolean
		canEdit: boolean
	}
}

export function CheckpointReadView({ projectId, locale, checkpoint }: Props) {
	const router = useRouter()

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">Checkpoint Details</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Notes */}
				{checkpoint.notes ? (
					<div className="space-y-1">
						<p className="text-sm font-medium text-muted-foreground">Notes</p>
						<p className="leading-relaxed">{checkpoint.notes}</p>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">No notes provided.</p>
				)}

				{/* Related link */}
				{checkpoint.url && (
					<div className="pt-2">
						<Button asChild variant="outline">
							<Link
								href={checkpoint.url}
								target="_blank"
								onClick={(e) => e.stopPropagation()}
							>
								Open Related Link
							</Link>
						</Button>
					</div>
				)}

				{checkpoint.canEdit && (
					<>
						<Separator />

						<div className="flex gap-2">
							<Button
								onClick={() =>
									router.push(
										`/${locale}/projects/${projectId}/checkpoints/${checkpoint.id}/edit`
									)
								}
							>
								Complete this Checkpoint
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
