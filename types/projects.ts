// types/projects.ts
export type ProjectFormMode = 'create' | 'update' | 'read' | 'delete'

export type ProjectFormValues = {
	name: string
	sortOrder: string
	instructions: string
	difficulty: Difficulty
	specific: string
	measurable: string
	achievable: string
	relevant: string

	// ISO date strings (yyyy-mm-dd) or ''
	targetDate: string
	actualCompletionDate: string
	isArchived: boolean
}

export type ProjectFormResult = { ok: true } | { ok: false; message: string }

export type ProjectSummary = {
	id: string
	name: string
	difficulty: Difficulty
	sortOrder: number
	targetDate: string
	progressPercent: number
	totalMinutes: number
}
export type CheckpointSummary = {
	id: string
	name: string
	url: string
	notes: string
	projectId: number
}

export type ProjectSummaryRow = {
	id: string
	name: string
	target_date: Date | null
	total_minutes: number
	progress: number
}

export type PublicProject = {
	id: string
	name: string
	difficulty: Difficulty
	sortOrder: number
	instructions: string
	specific: string
	measurable: string
	achievable: string
	relevant: string
	targetDate: string
	actualCompletionDate: string
}

export type ProjectSummaryExpanded = {
	// project fields
	id: string
	name: string
	difficulty: Difficulty
	sortOrder: number
	instructions: string | null

	specific: string | null
	measurable: string | null
	achievable: string | null
	relevant: string | null

	targetDate: string | null
	actualCompletionDate: string | null

	isArchived: boolean
	createdAt: Date
	createdByUserId: string

	// summary fields
	progressPercent: number
	totalMinutes: number

	// NEW
	topCheckpoints: {
		id: string
		name: string
		completed: boolean
	}[]
}

export type CheckpointAdminFormValues = {
	name: string
	url: string
	notes: string
	projectId: number
}

export type CheckpointFormMode = 'create' | 'update' | 'read'
export type Difficulty = 'easy' | 'medium' | 'difficult'

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
	estimatedDuration: string
	isCompleted: boolean
	canEdit: boolean
}

export type ProjectCheckpointRow = {
	id: string
	name: string
	isCompleted: boolean
	totalMinutes: number
	estimatedDuration: number
}
