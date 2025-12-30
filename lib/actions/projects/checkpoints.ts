'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/db'
import { projectCheckpoints } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type ProjectCheckpointFormValues = {
	projectId: string
	name: string
	url: string
	notes: string
	sortOrder: string
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
	url: z.string().url().optional().nullable(),
	notes: z.string().catch(''),
	sortOrder: z.coerce.number().int().min(0),
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
			url: true,
			notes: true,
			sortOrder: true,
		},
	})

	if (!row) return null

	return {
		id: row.id,
		projectId: row.projectId,
		name: row.name,
		url: row.url ?? '',
		notes: row.notes ?? '',
		sortOrder: String(row.sortOrder ?? 0),
	}
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
					url: data.url ?? null,
					notes: data.notes || null,
					sortOrder: data.sortOrder,
				})
				.returning({ id: projectCheckpoints.id })

			revalidatePath('/admin/projects')
			revalidatePath(`/admin/projects/${data.projectId}`)

			return { ok: true, id: row?.id }
		}

		// update
		if (!checkpointId) {
			return { ok: false, message: 'Missing checkpoint id' }
		}

		await db
			.update(projectCheckpoints)
			.set({
				name: data.name,
				url: data.url ?? null,
				notes: data.notes || null,
				sortOrder: data.sortOrder,
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
