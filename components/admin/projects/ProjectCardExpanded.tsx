'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectSummaryExpanded } from '@/types/projects'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { toPascal } from 'postgres'

type Props = {
	projects: ProjectSummaryExpanded[]
	locale: string
	isAdmin?: boolean
}

export function ProjectCardExpanded({ projects, locale, isAdmin }: Props) {
	const router = useRouter()

	function truncateWords(text: string | null | undefined, maxWords: number) {
		if (!text) return ''
		const words = text.trim().split(/\s+/)
		return words.length > maxWords
			? words.slice(0, maxWords).join(' ') + '…'
			: text
	}

	return (
		<div className="grid gap-3">
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

						<div className="flex flex-col sm:flex-row items-center gap-3">
							<ProgressCircle percent={p.progressPercent} />

							<div className="w-full flex-1 min-w-0">
								<div className="truncate text-lg md:text-xl font-bold text-wrap">
									{p.name}
								</div>

								<div className="flex items-center gap-2">
									<span className="text-base lg:text-lg text-muted-foreground">
										Goal: {p.targetDate || 'No date'} &bull;
									</span>
									<span className="text-base lg:text-lg text-muted-foreground capitalize">
										Difficulty: {p.difficulty}
									</span>
								</div>
								<span>{truncateWords(p.instructions, 36)}</span>
								<p className="text-sm text-muted-foreground">Read more...</p>
							</div>
						</div>
						<div>
							<h3 className="font-semibold">Get Involved:</h3>
							<div
								className="mt-2 min-w-0 w-full flex flex-wrap gap-2"
								onClick={(e) => e.stopPropagation()}
							>
								{p.topCheckpoints.length === 0 && (
									<span className="text-sm text-muted-foreground">
										No checkpoints yet
									</span>
								)}

								{p.topCheckpoints.map((cp) => {
									const checkpointHref = `/${locale}/projects/${p.id}/checkpoints/${cp.id}`

									// if (cp.completed) {
									// 	return (
									// 		<Button
									// 			key={cp.id}
									// 			variant="outline"
									// 			size="sm"
									// 			disabled
									// 			className="max-w-full truncate justify-start cursor-default opacity-70 whitespace-normal"
									// 			title={`${cp.name} (completed)`}
									// 		>
									// 			{cp.name}
									// 		</Button>
									// 	)
									// }

									return (
										<Button
											key={cp.id}
											variant="default"
											size="sm"
											className="max-w-full truncate justify-start whitespace-normal"
											onClick={() => router.push(checkpointHref)}
											title={cp.name}
										>
											{cp.name}
										</Button>
									)
								})}
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
