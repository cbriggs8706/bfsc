'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectSummary } from '@/types/projects'

type Props = {
	projects: ProjectSummary[]
	locale: string
}

export function ProjectCardGrid({ projects, locale }: Props) {
	const router = useRouter()

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{projects.map((p) => (
				<Card
					key={p.id}
					className="px-3 py-2 hover:bg-muted/50 transition cursor-pointer"
					onClick={() => router.push(`/${locale}/admin/projects/${p.id}`)}
				>
					<div className="flex items-center gap-3">
						<ProgressCircle percent={p.progressPercent} />

						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-medium">{p.name}</div>

							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
									<span>{p.targetDate || 'No date'}</span>
									<span className="opacity-50">•</span>
									<span>{Math.round(p.totalMinutes / 60)}h</span>
								</div>

								<Button
									size="sm"
									variant="outline"
									onClick={(e) => {
										e.stopPropagation()
										router.push(`/${locale}/admin/projects/${p.id}/checkpoints`)
									}}
								>
									Checkpoints
								</Button>
							</div>
						</div>
					</div>
				</Card>
			))}
		</div>
	)
}

/* ------------------------------------------------------------------
   Compact progress ring (unchanged)
------------------------------------------------------------------ */
function ProgressCircle({ percent }: { percent: number }) {
	const radius = 12
	const stroke = 3
	const size = 32
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
				className="fill-current text-[9px] font-medium"
			>
				{percent}%
			</text>
		</svg>
	)
}
