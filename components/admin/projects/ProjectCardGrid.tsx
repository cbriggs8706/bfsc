'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectSummary } from '@/types/projects'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

type Props = {
	projects: ProjectSummary[]
	locale: string
	isAdmin?: boolean
}

export function ProjectCardGrid({ projects, locale, isAdmin }: Props) {
	const router = useRouter()

	return (
		<div className="grid gap-3 lg:grid-cols-2">
			{projects.map((p) => {
				const href = isAdmin
					? `/${locale}/admin/projects/${p.id}`
					: `/${locale}/projects/${p.id}`

				return (
					<Card
						key={p.id}
						className="relative px-3 py-2 hover:bg-muted/50 transition cursor-pointer"
						onClick={() => router.push(href)}
					>
						{/* ───────────────────────────────────────────
					   Kebab menu (top-right)
					─────────────────────────────────────────── */}
						{isAdmin && (
							<div className="absolute top-2 right-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8"
											onClick={(e) => e.stopPropagation()}
										>
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation()
												router.push(
													`/${locale}/admin/projects/${p.id}/checkpoints`
												)
											}}
										>
											Checkpoints
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation()
												router.push(`/${locale}/admin/projects/update/${p.id}`)
											}}
										>
											Edit
										</DropdownMenuItem>

										<DropdownMenuItem
											className="text-destructive"
											onClick={(e) => {
												e.stopPropagation()
												router.push(`/${locale}/admin/projects/delete/${p.id}`)
											}}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}

						{/* ─────────────────────────────────────────── */}

						<div className="flex items-center gap-3">
							<ProgressCircle percent={p.progressPercent} />

							<div className="min-w-0 flex-1">
								<div className="truncate text-lg font-medium">{p.name}</div>

								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 text-lg text-muted-foreground">
										<span>Goal: {p.targetDate || 'No date'}</span>
										{/* <span>Difficulty: {p.totalMinutes || 'No date'}</span> */}
									</div>
								</div>
							</div>
						</div>
					</Card>
				)
			})}
		</div>
	)
}

/* ------------------------------------------------------------------
   Compact progress ring (unchanged)
------------------------------------------------------------------ */
function ProgressCircle({ percent }: { percent: number }) {
	const radius = 48
	const stroke = 12
	const size = 128
	const circumference = 2 * Math.PI * radius
	const offset = circumference - (percent / 100) * circumference

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0"
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				className="stroke-muted-foreground/30"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="stroke-primary"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
			<text
				x="50%"
				y="50%"
				textAnchor="middle"
				dominantBaseline="central"
				className="fill-current text-20 font-medium"
			>
				{percent}%
			</text>
		</svg>
	)
}
