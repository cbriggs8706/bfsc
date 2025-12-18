// types/training.ts
/* ============================================================
   BLOCK DATA TYPES
============================================================ */

export type TextBlockData = {
	title?: string
	bodyMarkdown: string
}

export type ImageBlockData = {
	path: string // Supabase storage path
	alt?: string
	caption?: string
}

export type LinkBlockData = {
	url: string
	label?: string
	kind?: 'quiz' | 'resource' | 'video' | 'other'
}

export type LessonBlockInput =
	| {
			type: 'text'
			data: TextBlockData
	  }
	| {
			type: 'image'
			data: ImageBlockData
	  }
	| {
			type: 'link'
			data: LinkBlockData
	  }

/* ============================================================
   BLOCK TYPE MAP (SINGLE SOURCE OF TRUTH)
============================================================ */

export type LessonBlockTypeMap = {
	text: TextBlockData
	image: ImageBlockData
	link: LinkBlockData
}

/* ============================================================
   GENERIC BLOCK SHAPES
============================================================ */

/**
 * Generic block shape used for:
 * - DB records
 * - UI rendering
 * - Admin editors
 */
export type LessonBlock<T extends keyof LessonBlockTypeMap> = {
	id: string
	lessonId: string
	type: T
	sortOrder: number
	data: LessonBlockTypeMap[T]
	createdAt: Date
	updatedAt: Date
}

/**
 * Discriminated union of all blocks
 */
export type AnyLessonBlock = {
	[K in keyof LessonBlockTypeMap]: LessonBlock<K>
}[keyof LessonBlockTypeMap]

/* ============================================================
   INPUT TYPES (CREATION / UPDATE)
============================================================ */

/**
 * Creation input (no id, timestamps)
 */
export type CreateLessonBlockInput<T extends keyof LessonBlockTypeMap> = {
	lessonId: string
	type: T
	sortOrder?: number
	data: LessonBlockTypeMap[T]
}

/**
 * Union version (used by server actions)
 */
export type CreateLessonBlockUnion = {
	[K in keyof LessonBlockTypeMap]: CreateLessonBlockInput<K>
}[keyof LessonBlockTypeMap]

/**
 * Update input (partial, but type-safe)
 */
export type UpdateLessonBlockInput<T extends keyof LessonBlockTypeMap> = {
	type?: T
	sortOrder?: number
	data?: Partial<LessonBlockTypeMap[T]>
}

/**
 * Union update type
 */
export type UpdateLessonBlockUnion = {
	[K in keyof LessonBlockTypeMap]: UpdateLessonBlockInput<K>
}[keyof LessonBlockTypeMap]

/* ============================================================
   HELPERS
============================================================ */

/**
 * Convenience type guards (optional but nice)
 */
export function isTextBlock(
	block: AnyLessonBlock
): block is LessonBlock<'text'> {
	return block.type === 'text'
}

export function isImageBlock(
	block: AnyLessonBlock
): block is LessonBlock<'image'> {
	return block.type === 'image'
}

export function isLinkBlock(
	block: AnyLessonBlock
): block is LessonBlock<'link'> {
	return block.type === 'link'
}

export type AdminLesson = {
	id: string
	title: string
	sortOrder: number
	blocks: AnyLessonBlock[]
}

export type AdminUnit = {
	id: string
	title: string
	sortOrder: number
	lessons: AdminLesson[]
}

export type AdminCourse = {
	id: string
	title: string
	slug: string
	description?: string | null
	units: AdminUnit[]
}

export type CreateLessonBlockDraft<T extends keyof LessonBlockTypeMap> = {
	type: T
	sortOrder?: number
	data: LessonBlockTypeMap[T]
}

export type CreateLessonBlockDraftUnion = {
	[K in keyof LessonBlockTypeMap]: CreateLessonBlockDraft<K>
}[keyof LessonBlockTypeMap]

export type UserLesson = {
	id: string
	title: string
	isCompleted: boolean
	blocks: AnyLessonBlock[]
}

export type UserUnit = {
	id: string
	title: string
	lessons: UserLesson[]
}

export type UserCourse = {
	id: string
	title: string
	description?: string | null
	units: UserUnit[]
	completedLessonCount: number
	contentVersion: number
	totalLessonCount: number
	isCompleted: boolean
}

export type UserCertificate = {
	id: string
	userId: string

	// 🔑 versioning
	courseId?: string | null
	courseVersion?: number | null

	title: string
	category?: string | null
	level?: number | null
	source: 'internal' | 'external'

	issuedAt: Date
	verifyUrl?: string | null
}

export type CertificateSummary = {
	id: string
	title: string
	category?: string | null
	level?: number | null
	source: 'internal' | 'external'
	status: 'current' | 'renewal-required'
}
