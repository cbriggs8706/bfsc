type Props = {
	project: {
		name: string
		difficulty: string
		instructions: string | null
		specific: string | null
		measurable: string | null
		achievable: string | null
		relevant: string | null
		targetDate: string | null
		actualCompletionDate: string | null
	}
}

export function ProjectReadView({ project }: Props) {
	return (
		<div className="space-y-4">
			{project.instructions && (
				<p className="text-base">{project.instructions}</p>
			)}
			{project.difficulty && (
				<div className="text-sm">Difficulty: {project.difficulty}</div>
			)}
			<div className="grid gap-3 sm:grid-cols-2">
				<ProjectField label="Specific" value={project.specific || ''} />
				<ProjectField label="Measurable" value={project.measurable || ''} />
				<ProjectField label="Achievable" value={project.achievable || ''} />
				<ProjectField label="Relevant" value={project.relevant || ''} />
			</div>

			<div className="flex gap-6 text-sm">
				{/* <div>Target: {project.targetDate || '—'}</div> */}
				<div>Completed: {project.actualCompletionDate || '—'}</div>
			</div>
		</div>
	)
}

function ProjectField({ label, value }: { label: string; value: string }) {
	if (!value) return null

	return (
		<div>
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="text-sm">{value}</div>
		</div>
	)
}
