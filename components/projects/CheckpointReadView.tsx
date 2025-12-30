'use client'

import { useRouter } from 'next/navigation'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useTranslations } from 'next-intl'

type Props = {
	projectId: string
	locale: string
	checkpoint: {
		id: string
		name: string
		estimatedDuration: string
		notes: string
		url: string
		isCompleted: boolean
		canEdit: boolean
	}
}

export function CheckpointReadView({ projectId, locale, checkpoint }: Props) {
	const router = useRouter()
	const t = useTranslations('common')
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
				{checkpoint.estimatedDuration && (
					<div className="text-sm">
						{t('projects.estimatedDuration')}: {checkpoint.estimatedDuration}{' '}
						min
					</div>
				)}
				<div className="text-sm text-muted-foreground">
					Status:{' '}
					{checkpoint.isCompleted ? `${t('completed')}` : `${t('inProgress')}`}
				</div>

				{/* Related link */}
				{checkpoint.url && (
					<div className="pt-2">
						<Button asChild variant="outline">
							<Link href={checkpoint.url} target="_blank">
								Open Related Link
							</Link>
						</Button>
					</div>
				)}

				{!checkpoint.isCompleted && (
					<>
						<Separator />
						<Button
							onClick={() =>
								router.push(
									`/${locale}/projects/${projectId}/checkpoints/${checkpoint.id}/contribute`
								)
							}
						>
							Log time / update
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	)
}
