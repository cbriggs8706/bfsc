'use server'

import { db } from '@/db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { requireRole } from '@/utils/require-role'
import { projectCheckpoints } from '@/db/schema/tables/projects'

/* ------------------------------------------------------------------
   Input schema
------------------------------------------------------------------ */
const BulkCheckpointSchema = z.object({
	rows: z.array(
		z.object({
			name: z.string().min(1),
			notes: z.string().optional(),
			url: z.union([z.literal(''), z.string().url()]).optional(),
			estimatedDuration: z.coerce.number().int().min(1).optional(),
		})
	),
	mode: z.enum(['append', 'replace']),
})

export async function saveProjectCheckpointsBulk(
	locale: string,
	projectId: string,
	raw: unknown
): Promise<{ ok: true } | { ok: false; message: string }> {
	// 🔒 Admin-only
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	const parsed = BulkCheckpointSchema.safeParse(raw)
	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const { rows, mode } = parsed.data

	try {
		await db.transaction(async (tx) => {
			if (mode === 'replace') {
				await tx
					.delete(projectCheckpoints)
					.where(eq(projectCheckpoints.projectId, projectId))
			}

			if (rows.length > 0) {
				await tx.insert(projectCheckpoints).values(
					rows.map((r, i) => ({
						projectId,
						name: r.name,
						notes: r.notes ?? null,
						url: r.url ?? null,
						estimatedDuration: r.estimatedDuration ?? 1,
						sortOrder: i,
					}))
				)
			}
		})

		return { ok: true }
	} catch {
		return { ok: false, message: 'Failed to save checkpoints' }
	}
}
