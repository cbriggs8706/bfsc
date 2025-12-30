'use server'

import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import {
	projectCheckpointCompletions,
	projectCheckpoints,
	projects,
} from '@/db/schema/tables/projects'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectSummary, PublicProject } from '@/types/projects'

/* ------------------------------------------------------------------
   Server input schema (authoritative)
------------------------------------------------------------------ */
const ProjectInputSchema = z.object({
	name: z.string().min(1),

	instructions: z.string().optional(),

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
export async function readProjectForForm(projectId: string) {
	const row = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	})

	if (!row) return null

	const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

	return {
		name: row.name,

		instructions: row.instructions ?? '',

		specific: row.specific ?? '',
		measurable: row.measurable ?? '',
		achievable: row.achievable ?? '',
		relevant: row.relevant ?? '',

		targetDate: fmt(row.targetDate),
		actualCompletionDate: fmt(row.actualCompletionDate),

		isArchived: row.isArchived,
	}
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

			target_date: projects.targetDate,

			total_minutes: sql<number>`
				COALESCE(SUM(${projectCheckpointCompletions.minutesSpent}), 0)
			`,

			progress: sql<number>`
				CASE
					WHEN COUNT(DISTINCT ${projectCheckpoints.id}) = 0 THEN 0
					ELSE
						ROUND(
							(COUNT(DISTINCT ${projectCheckpointCompletions.checkpointId})::decimal
							/ COUNT(DISTINCT ${projectCheckpoints.id})::decimal) * 100
						)
				END
			`,
		})
		.from(projects)
		.leftJoin(
			projectCheckpoints,
			sql`${projectCheckpoints.projectId} = ${projects.id}`
		)
		.leftJoin(
			projectCheckpointCompletions,
			sql`${projectCheckpointCompletions.checkpointId} = ${projectCheckpoints.id}`
		)
		.where(sql`${projects.isArchived} = false`)
		.groupBy(projects.id)
		.orderBy(projects.targetDate, projects.name)

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		targetDate: r.target_date ? r.target_date.toISOString().slice(0, 10) : '',
		progressPercent: r.progress,
		totalMinutes: r.total_minutes,
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
				instructions: data.instructions ?? null,

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
					instructions: data.instructions ?? null,

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
