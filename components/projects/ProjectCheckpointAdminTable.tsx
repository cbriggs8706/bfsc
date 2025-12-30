'use client'

import { useRouter } from 'next/navigation'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import Link from 'next/link'

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
	canEdit?: boolean
}

export function ProjectCheckpointAdminTable({
	projectId,
	locale,
	checkpoints,
	canEdit,
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
							{/* <th className="p-2">Minutes</th> */}
							{canEdit && <th className="p-2">Actions</th>}
						</tr>
					</thead>
					<tbody className="divide-y">
						{checkpoints.map((c) => (
							<tr
								key={c.id}
								className="cursor-pointer hover:bg-muted/50"
								onClick={() =>
									router.push(`/${locale}/admin/projects/checkpoints/${c.id}`)
								}
							>
								<td className="p-2 truncate">{c.name}</td>
								<td className="p-2 text-center">
									{c.isCompleted ? 'Complete' : 'Open'}
								</td>
								{/* <td className="p-2 text-center">
									{Math.round(c.totalMinutes)}
								</td> */}
								{canEdit && (
									<td className="p-2 text-right space-x-2">
										<Button
											size="sm"
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Link
												href={`/${locale}/admin/projects/checkpoints/update/${c.id}`}
											>
												Edit
											</Link>
										</Button>
										<Button
											size="sm"
											variant="destructive"
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Link
												href={`/${locale}/admin/projects/checkpoints/delete/${c.id}`}
											>
												Delete
											</Link>
										</Button>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</Card>
		</div>
	)
}
