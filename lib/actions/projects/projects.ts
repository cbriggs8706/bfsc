'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import {
	projectCheckpointContributions,
	projectCheckpoints,
	projects,
} from '@/db'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	ProjectFormValues,
	ProjectSummary,
	ProjectSummaryExpanded,
	PublicProject,
} from '@/types/projects'

/* ------------------------------------------------------------------
   Server input schema (authoritative)
------------------------------------------------------------------ */
const ProjectInputSchema = z.object({
	name: z.string().min(1),
	sortOrder: z.coerce.number().int().min(0),
	instructions: z.string().optional(),
	difficulty: z.enum(['easy', 'medium', 'difficult']).default('easy'),
	// SMART
	specific: z.string().optional(),
	measurable: z.string().optional(),
	achievable: z.string().optional(),
	relevant: z.string().optional(),

	// Dates arrive as strings
	targetDate: z.string().optional(),
	actualCompletionDate: z.string().optional(),

	// boolean-ish
	isArchived: z.coerce.boolean(),
})

export type ProjectActionResult = { ok: true } | { ok: false; message: string }

/* ------------------------------------------------------------------
   FORM-SHAPED READ
------------------------------------------------------------------ */
export async function readProjectForForm(id: string) {
	noStore()
	if (!id) throw new Error('Missing project id')

	const row = await db.query.projects.findFirst({
		where: eq(projects.id, id),
	})

	if (!row) return null

	const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

	return {
		id: row.id,
		name: row.name,
		sortOrder: String(row.sortOrder ?? 0),
		instructions: row.instructions ?? '',
		difficulty: row.difficulty ?? 'easy',
		specific: row.specific ?? '',
		measurable: row.measurable ?? '',
		achievable: row.achievable ?? '',
		relevant: row.relevant ?? '',
		targetDate: fmt(row.targetDate),
		actualCompletionDate: fmt(row.actualCompletionDate),
		isArchived: row.isArchived ?? false,
	} satisfies ProjectFormValues & { id: string }
}

export async function readPublicProject(
	projectId: string
): Promise<PublicProject | null> {
	const row = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	})

	if (!row) return null

	const fmt = (d: Date | null): string =>
		d ? d.toISOString().slice(0, 10) : ''

	return {
		id: row.id,
		name: row.name,
		difficulty: row.difficulty,
		sortOrder: row.sortOrder,
		instructions: row.instructions ?? '',
		specific: row.specific ?? '',
		measurable: row.measurable ?? '',
		achievable: row.achievable ?? '',
		relevant: row.relevant ?? '',
		targetDate: fmt(row.targetDate),
		actualCompletionDate: fmt(row.actualCompletionDate),
	}
}

export async function readProjectSummaries(): Promise<ProjectSummary[]> {
	const rows = await db
		.select({
			id: projects.id,
			name: projects.name,
			difficulty: projects.difficulty,
			sortOrder: projects.sortOrder,
			target_date: projects.targetDate,

			total_minutes: sql<number>`
				COALESCE(SUM(${projectCheckpointContributions.minutesSpent}), 0)
			`,

			progress: sql<number>`
				CASE
					WHEN COUNT(${projectCheckpoints.id}) = 0 THEN 0
					ELSE
						ROUND(
							(
								COUNT(*) FILTER (
									WHERE ${projectCheckpoints.isCompleted} = true
								)::decimal
								/ COUNT(${projectCheckpoints.id})::decimal
							) * 100
						)
				END
			`,
		})
		.from(projects)
		.leftJoin(projectCheckpoints, eq(projectCheckpoints.projectId, projects.id))
		.leftJoin(
			projectCheckpointContributions,
			eq(projectCheckpointContributions.checkpointId, projectCheckpoints.id)
		)
		.where(eq(projects.isArchived, false))
		.groupBy(projects.id)
		.orderBy(projects.sortOrder, projects.targetDate)

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		difficulty: r.difficulty,
		sortOrder: r.sortOrder,
		targetDate: r.target_date ? r.target_date.toISOString().slice(0, 10) : '',
		progressPercent: r.progress,
		totalMinutes: r.total_minutes,
	}))
}

export async function readProjectSummariesExpanded(): Promise<
	ProjectSummaryExpanded[]
> {
	noStore()

	const rows = await db
		.select({
			// --- project fields ---
			id: projects.id,
			name: projects.name,
			difficulty: projects.difficulty,
			sortOrder: projects.sortOrder,
			instructions: projects.instructions,

			specific: projects.specific,
			measurable: projects.measurable,
			achievable: projects.achievable,
			relevant: projects.relevant,

			targetDate: projects.targetDate,
			actualCompletionDate: projects.actualCompletionDate,

			isArchived: projects.isArchived,
			createdAt: projects.createdAt,
			createdByUserId: projects.createdByUserId,

			// --- aggregates ---
			totalMinutes: sql<number>`
	COALESCE(SUM(${projectCheckpointContributions.minutesSpent}), 0)
`,

			progressPercent: sql<number>`
	CASE
		WHEN COUNT(${projectCheckpoints.id}) = 0 THEN 0
		ELSE
			ROUND(
				(
					COUNT(*) FILTER (
						WHERE ${projectCheckpoints.isCompleted} = true
					)::decimal
					/ COUNT(${projectCheckpoints.id})::decimal
				) * 100
			)
	END
`,

			// --- checkpoints ---
			topCheckpoints: sql<
				{
					id: string
					name: string
					completed: boolean
				}[]
			>`
(
	SELECT COALESCE(json_agg(row_to_json(cp)), '[]'::json)
	FROM (
		SELECT
			c.id,
			c.name,
			c.is_completed AS completed
		FROM ${projectCheckpoints} c
		WHERE c.project_id = ${projects.id}
			AND c.is_completed = false
		ORDER BY c.sort_order ASC, c.created_at ASC
	) cp
)
`,
		})
		.from(projects)
		.leftJoin(projectCheckpoints, eq(projectCheckpoints.projectId, projects.id))
		.leftJoin(
			projectCheckpointContributions,
			eq(projectCheckpointContributions.checkpointId, projectCheckpoints.id)
		)
		.where(eq(projects.isArchived, false))
		.groupBy(projects.id)
		.orderBy(projects.sortOrder, projects.targetDate)

	const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

	return rows.map((r) => ({
		...r,
		targetDate: fmt(r.targetDate),
		actualCompletionDate: fmt(r.actualCompletionDate),
	}))
}

/* ------------------------------------------------------------------
   SAVE
------------------------------------------------------------------ */
export async function saveProject(
	mode: 'create' | 'update',
	projectId: string | null,
	raw: unknown
): Promise<ProjectActionResult> {
	const parsed = ProjectInputSchema.safeParse(raw)

	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const data = parsed.data

	const targetDate =
		data.targetDate && data.targetDate !== '' ? new Date(data.targetDate) : null

	const actualCompletionDate =
		data.actualCompletionDate && data.actualCompletionDate !== ''
			? new Date(data.actualCompletionDate)
			: null

	try {
		if (mode === 'create') {
			const session = await getServerSession(authOptions)
			const userId = session?.user?.id

			if (!userId) {
				return { ok: false, message: 'Unauthorized' }
			}

			await db.insert(projects).values({
				name: data.name,
				sortOrder: data.sortOrder,
				instructions: data.instructions ?? null,
				difficulty: data.difficulty,
				specific: data.specific ?? null,
				measurable: data.measurable ?? null,
				achievable: data.achievable ?? null,
				relevant: data.relevant ?? null,

				targetDate,
				actualCompletionDate,

				isArchived: data.isArchived,

				createdByUserId: userId, // ✅ REQUIRED
			})
		} else {
			await db
				.update(projects)
				.set({
					name: data.name,
					sortOrder: data.sortOrder,
					instructions: data.instructions ?? null,
					difficulty: data.difficulty,

					specific: data.specific ?? null,
					measurable: data.measurable ?? null,
					achievable: data.achievable ?? null,
					relevant: data.relevant ?? null,

					targetDate,
					actualCompletionDate,

					isArchived: data.isArchived,
				})
				.where(eq(projects.id, projectId!))
		}

		return { ok: true }
	} catch {
		return { ok: false, message: 'Database error' }
	}
}

/* ------------------------------------------------------------------
   DELETE
------------------------------------------------------------------ */
export async function deleteProject(
	projectId: string
): Promise<ProjectActionResult> {
	try {
		await db.delete(projects).where(eq(projects.id, projectId))
		return { ok: true }
	} catch {
		return { ok: false, message: 'Delete failed' }
	}
}
