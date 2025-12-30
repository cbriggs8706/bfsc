'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

type CheckpointRow = {
	id: string
	name: string
	url?: string
	notes?: string
	isCompleted: boolean
	totalMinutes: number
}

type Props = {
	projectId: string
	locale: string
	checkpoints: CheckpointRow[]
	canEdit?: boolean
}

export function ProjectCheckpointTable({
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
				<Table className="table-fixed w-full text-sm">
					{/* ---------------- Header ---------------- */}
					<TableHeader>
						<TableRow>
							<TableHead className="w-[30%]">Name</TableHead>
							<TableHead className="w-[15%]">URL</TableHead>
							<TableHead className="w-[8%]">Tot Min.</TableHead>
							<TableHead className="w-[15%] hidden lg:table-cell">
								Notes
							</TableHead>
							<TableHead className="w-[8%] text-center">Status</TableHead>
							<TableHead className="w-[20%] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>

					{/* ---------------- Body ---------------- */}
					<TableBody>
						{checkpoints.map((c) => (
							<TableRow
								key={c.id}
								className="cursor-pointer hover:bg-muted/50"
								onClick={() =>
									router.push(
										`/${locale}/projects/${projectId}/checkpoints/${c.id}`
									)
								}
							>
								{/* Name */}
								<TableCell className="truncate font-medium">{c.name}</TableCell>

								{/* URL */}
								<TableCell className="truncate">
									{c.url ? (
										<Link
											href={c.url}
											className="underline"
											target="_blank"
											onClick={(e) => e.stopPropagation()}
										>
											Link
										</Link>
									) : (
										'—'
									)}
								</TableCell>

								<TableCell className="text-xs text-muted-foreground">
									{(c.totalMinutes / 60).toFixed(1)}h
								</TableCell>

								{/* Notes */}
								<TableCell className="truncate hidden lg:table-cell">
									{c.notes ?? '—'}
								</TableCell>

								{/* Status */}
								<TableCell className="text-center whitespace-nowrap">
									{c.isCompleted ? 'Complete' : 'Open'}
								</TableCell>

								{/* Actions */}
								<TableCell
									className="text-right"
									onClick={(e) => e.stopPropagation()}
								>
									{!c.isCompleted && (
										<Button size="sm" asChild>
											<Link
												href={`/${locale}/projects/${projectId}/checkpoints/${c.id}/contribute`}
											>
												Add Time
											</Link>
										</Button>
									)}

									{c.isCompleted && canEdit && (
										<Button size="sm" variant="outline" asChild>
											<Link
												href={`/${locale}/projects/${projectId}/checkpoints/${c.id}/contribute`}
											>
												Adjust
											</Link>
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	)
}
