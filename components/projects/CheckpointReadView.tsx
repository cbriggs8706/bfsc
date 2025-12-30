'use client'

import { useRouter } from 'next/navigation'

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
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">{checkpoint.name}</h1>

			{checkpoint.notes && <p className="text-sm">{checkpoint.notes}</p>}

			{checkpoint.url && (
				<a href={checkpoint.url} className="text-sm underline" target="_blank">
					Related link
				</a>
			)}

			<div className="flex gap-2">
				{checkpoint.canEdit && (
					<button
						className="btn"
						onClick={() =>
							router.push(
								`/${locale}/projects/${projectId}/checkpoints/${checkpoint.id}/edit`
							)
						}
					>
						Edit / Complete
					</button>
				)}
			</div>
		</div>
	)
}
