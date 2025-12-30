'use client'

import { useRouter } from 'next/navigation'
import { Card } from '../ui/card'

type CheckpointRow = {
	id: string
	name: string
	isCompleted: boolean
	totalMinutes: number
}

type Props = {
	projectId: string
	locale: string
	checkpoints: CheckpointRow[]
}

export function ProjectCheckpointTable({
	projectId,
	locale,
	checkpoints,
}: Props) {
	const router = useRouter()

	return (
		<div>
			<h2 className="text-lg font-semibold mb-2">Checkpoints</h2>

			<Card className="p-4">
				<table className="w-full text-sm">
					<thead className="">
						<tr>
							<th className="text-left p-2">Name</th>
							<th className="p-2">Status</th>
							<th className="p-2">Minutes</th>
						</tr>
					</thead>
					<tbody>
						{checkpoints.map((c) => (
							<tr
								key={c.id}
								className="cursor-pointer hover:bg-muted/50"
								onClick={() =>
									router.push(
										`/${locale}/projects/${projectId}/checkpoints/${c.id}`
									)
								}
							>
								<td className="p-2">{c.name}</td>
								<td className="p-2 text-center">
									{c.isCompleted ? 'Complete' : 'Open'}
								</td>
								<td className="p-2 text-center">
									{Math.round(c.totalMinutes)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Card>
		</div>
	)
}
