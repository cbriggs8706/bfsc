'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { eq, asc, desc } from 'drizzle-orm'
import { db, projectCheckpointContributions, user } from '@/db'
import { projectCheckpoints } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { requireRole } from '@/utils/require-role'
import { Difficulty } from '@/types/projects'

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type ProjectCheckpointFormValues = {
	projectId: string
	name: string
	difficulty: Difficulty
	url: string
	notes: string
	sortOrder: string
	estimatedDuration: string
}

export type ProjectCheckpointActionResult =
	| { ok: true; id?: string }
	| { ok: false; message: string }

/* ------------------------------------------------------------------ */
/* Zod schema (server authority) */
/* ------------------------------------------------------------------ */

const ProjectCheckpointInputSchema = z.object({
	projectId: z.string().uuid(),
	name: z.string().min(1),
	difficulty: z.enum(['easy', 'medium', 'difficult']).default('easy'),
	url: z.string().url().optional().nullable(),
	notes: z.string().catch(''),
	sortOrder: z.coerce.number().int().min(0),
	estimatedDuration: z.coerce.number().int().min(1),
})

/* ------------------------------------------------------------------ */
/* Reads */
/* ------------------------------------------------------------------ */

export async function readCheckpoint(id: string) {
	noStore()
	if (!id) throw new Error('Missing checkpoint id')

	return db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, id),
	})
}

export async function readProjectCheckpoints(projectId: string) {
	noStore()
	if (!projectId) throw new Error('Missing project id')

	return db.query.projectCheckpoints.findMany({
		where: eq(projectCheckpoints.projectId, projectId),
		orderBy: asc(projectCheckpoints.sortOrder),
	})
}

/**
 * Form-shaped read (for update/delete pages)
 */
export async function readCheckpointForForm(
	id: string
): Promise<(ProjectCheckpointFormValues & { id: string }) | null> {
	noStore()
	if (!id) throw new Error('Missing checkpoint id')

	const row = await db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, id),
		columns: {
			id: true,
			projectId: true,
			name: true,
			difficulty: true,
			url: true,
			notes: true,
			estimatedDuration: true,
			sortOrder: true,
		},
	})

	if (!row) return null

	return {
		id: row.id,
		projectId: row.projectId,
		name: row.name,
		difficulty: row.difficulty as 'easy' | 'medium' | 'difficult',
		url: row.url ?? '',
		notes: row.notes ?? '',
		estimatedDuration: String(row.estimatedDuration ?? 0),
		sortOrder: String(row.sortOrder ?? 0),
	}
}

export async function readCheckpointContributions(
	locale: string,
	checkpointId: string
) {
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	return db
		.select({
			id: projectCheckpointContributions.id,
			userId: projectCheckpointContributions.userId,
			userName: user.name,
			minutesSpent: projectCheckpointContributions.minutesSpent,
			createdAt: projectCheckpointContributions.createdAt,
		})
		.from(projectCheckpointContributions)
		.leftJoin(user, eq(user.id, projectCheckpointContributions.userId))
		.where(eq(projectCheckpointContributions.checkpointId, checkpointId))
		.orderBy(desc(projectCheckpointContributions.createdAt))
}
/* ------------------------------------------------------------------ */
/* Writes (Resource-style) */
/* ------------------------------------------------------------------ */

export async function saveCheckpoint(
	mode: 'create' | 'update',
	checkpointId: string | null,
	raw: unknown
): Promise<ProjectCheckpointActionResult> {
	const session = await getServerSession(authOptions)
	if (!session) return { ok: false, message: 'Unauthorized' }

	const parsed = ProjectCheckpointInputSchema.safeParse(raw)
	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const data = parsed.data

	try {
		if (mode === 'create') {
			const [row] = await db
				.insert(projectCheckpoints)
				.values({
					projectId: data.projectId,
					name: data.name,
					difficulty: data.difficulty,
					url: data.url ?? null,
					notes: data.notes || null,
					sortOrder: data.sortOrder,
					estimatedDuration: data.estimatedDuration,
				})
				.returning({ id: projectCheckpoints.id })

			revalidatePath('/admin/projects')
			revalidatePath(`/admin/projects/${data.projectId}`)

			return { ok: true, id: row?.id }
		}

		if (!checkpointId) {
			return { ok: false, message: 'Missing checkpoint id' }
		}

		await db
			.update(projectCheckpoints)
			.set({
				name: data.name,
				difficulty: data.difficulty,
				url: data.url ?? null,
				notes: data.notes || null,
				sortOrder: data.sortOrder,
				estimatedDuration: data.estimatedDuration,
			})
			.where(eq(projectCheckpoints.id, checkpointId))

		revalidatePath('/admin/projects')
		revalidatePath(`/admin/projects/${data.projectId}`)

		return { ok: true }
	} catch {
		return { ok: false, message: 'Database error' }
	}
}

/* ------------------------------------------------------------------ */
/* Delete */
/* ------------------------------------------------------------------ */

export async function deleteCheckpoint(
	checkpointId: string,
	projectId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const session = await getServerSession(authOptions)
	if (!session) return { ok: false, message: 'Unauthorized' }

	if (!checkpointId) {
		return { ok: false, message: 'Missing checkpoint id' }
	}

	try {
		await db
			.delete(projectCheckpoints)
			.where(eq(projectCheckpoints.id, checkpointId))

		revalidatePath('/admin/projects')
		revalidatePath(`/admin/projects/${projectId}`)

		return { ok: true }
	} catch {
		return { ok: false, message: 'Delete failed' }
	}
}

const UpdateSchema = z.object({
	contributionId: z.string().uuid(),
	minutesSpent: z.coerce.number().int().min(1),
})

export async function updateCheckpointContribution(
	locale: string,
	raw: unknown
) {
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	const parsed = UpdateSchema.safeParse(raw)
	if (!parsed.success) {
		return { ok: false, message: 'Invalid data' }
	}

	const { contributionId, minutesSpent } = parsed.data

	await db
		.update(projectCheckpointContributions)
		.set({ minutesSpent })
		.where(eq(projectCheckpointContributions.id, contributionId))

	return { ok: true }
}
