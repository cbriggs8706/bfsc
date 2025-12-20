'use client'

type Props = {
	completed: number
	total: number
}

export function CourseProgressBar({ completed, total }: Props) {
	const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

	return (
		<div className="space-y-1">
			<div className="h-2 rounded bg-muted">
				<div
					className="h-2 rounded bg-primary"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className="text-xs text-muted-foreground">
				{completed}/{total} lessons completed
			</p>
		</div>
	)
}
