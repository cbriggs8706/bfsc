// types/projects.ts
export type ProjectFormMode = 'create' | 'update' | 'read' | 'delete'

export type ProjectFormValues = {
	name: string
	instructions: string

	specific: string
	measurable: string
	achievable: string
	relevant: string

	// ISO date strings (yyyy-mm-dd) or ''
	targetDate: string
	actualCompletionDate: string

	// "true" | "false" (string in UI)
	isArchived: 'true' | 'false'
}

export type ProjectFormResult = { ok: true } | { ok: false; message: string }

export type ProjectSummary = {
	id: string
	name: string
	targetDate: string
	progressPercent: number
	totalMinutes: number
}

export type ProjectSummaryRow = {
	id: string
	name: string
	target_date: Date | null
	total_minutes: number
	progress: number
}

export type CheckpointFormMode = 'create' | 'update' | 'read'

export type CheckpointFormValues = {
	minutesSpent: string
	notes: string
	url: string
}

export type CheckpointFormResult = { ok: true } | { ok: false; message: string }

export type CheckpointDetail = {
	id: string
	name: string
	notes: string
	url: string
	isCompleted: boolean
	canEdit: boolean
}

export type PublicProject = {
	id: string
	name: string
	instructions: string
	specific: string
	measurable: string
	achievable: string
	relevant: string
	targetDate: string
	actualCompletionDate: string
}

export type ProjectCheckpointRow = {
	id: string
	name: string
	isCompleted: boolean
	totalMinutes: number
}
