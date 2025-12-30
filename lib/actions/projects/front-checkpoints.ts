'use server'

import { db } from '@/db'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	projectCheckpoints,
	projectCheckpointCompletions,
} from '@/db/schema/tables/projects'
import { requireRole } from '@/utils/require-role'
import type {
	CheckpointDetail,
	CheckpointFormResult,
	ProjectCheckpointRow,
} from '@/types/projects'

/* ------------------------------------------------------------------
   Server schema (authoritative)
------------------------------------------------------------------ */
const CheckpointInputSchema = z.object({
	minutesSpent: z.coerce.number().min(1),
})

export async function readCheckpointDetail(
	locale: string,
	checkpointId: string
): Promise<CheckpointDetail | null> {
	// Read checkpoint definition
	const checkpoint = await db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, checkpointId),
	})

	if (!checkpoint) return null

	// Completion = any completion row exists
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(projectCheckpointCompletions)
		.where(eq(projectCheckpointCompletions.checkpointId, checkpointId))

	const isCompleted = count > 0

	// Admin check (exactly as you specified)
	const isAdmin = await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)
		.then(() => true)
		.catch(() => false)

	return {
		id: checkpoint.id,
		name: checkpoint.name,
		notes: checkpoint.notes ?? '',
		url: checkpoint.url ?? '',
		isCompleted,
		canEdit: !isCompleted || isAdmin,
	}
}

export async function readProjectCheckpoints(
	projectId: string
): Promise<ProjectCheckpointRow[]> {
	const rows = await db
		.select({
			id: projectCheckpoints.id,
			name: projectCheckpoints.name,
			url: projectCheckpoints.url,
			notes: projectCheckpoints.notes,
			totalMinutes: sql<number>`
				COALESCE(SUM(${projectCheckpointCompletions.minutesSpent}), 0)
			`,

			completionCount: sql<number>`
				COUNT(${projectCheckpointCompletions.checkpointId})
			`,
		})
		.from(projectCheckpoints)
		.leftJoin(
			projectCheckpointCompletions,
			eq(projectCheckpointCompletions.checkpointId, projectCheckpoints.id)
		)
		.where(eq(projectCheckpoints.projectId, projectId))
		.groupBy(projectCheckpoints.id)
		.orderBy(projectCheckpoints.sortOrder)

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		url: r.url,
		notes: r.notes,
		totalMinutes: r.totalMinutes,
		isCompleted: r.completionCount > 0,
	}))
}

/* ------------------------------------------------------------------
   FORM-SHAPED READ (completion only)
------------------------------------------------------------------ */
export async function readCheckpointCompletionForForm(checkpointId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	const row = await db
		.select({
			minutesSpent: projectCheckpointCompletions.minutesSpent,
		})
		.from(projectCheckpointCompletions)
		.where(
			and(
				eq(projectCheckpointCompletions.checkpointId, checkpointId),
				eq(projectCheckpointCompletions.userId, session.user.id)
			)
		)
		.limit(1)

	if (!row[0]) return null

	return {
		minutesSpent: String(row[0].minutesSpent),
	}
}

/* ------------------------------------------------------------------
   SAVE (create or update completion)
------------------------------------------------------------------ */
export async function saveCheckpointCompletion(
	mode: 'create' | 'update',
	checkpointId: string,
	raw: unknown,
	locale: string
): Promise<CheckpointFormResult> {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return { ok: false, message: 'Unauthorized' }
	}

	const parsed = CheckpointInputSchema.safeParse(raw)
	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const { minutesSpent } = parsed.data

	// Is checkpoint defined?
	const checkpoint = await db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, checkpointId),
	})

	if (!checkpoint) {
		return { ok: false, message: 'Checkpoint not found' }
	}

	// Check if already completed by anyone
	const existingCompletion = await db
		.select({ id: projectCheckpointCompletions.checkpointId })
		.from(projectCheckpointCompletions)
		.where(eq(projectCheckpointCompletions.checkpointId, checkpointId))
		.limit(1)

	const isCompleted = existingCompletion.length > 0

	// Admin check
	const isAdmin = await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)
		.then(() => true)
		.catch(() => false)

	// Non-admins cannot edit completed checkpoints
	if (isCompleted && !isAdmin) {
		return { ok: false, message: 'Checkpoint is locked' }
	}

	try {
		if (mode === 'create') {
			await db.insert(projectCheckpointCompletions).values({
				checkpointId,
				userId: session.user.id,
				minutesSpent,
			})
		} else {
			await db
				.update(projectCheckpointCompletions)
				.set({ minutesSpent })
				.where(
					and(
						eq(projectCheckpointCompletions.checkpointId, checkpointId),
						eq(projectCheckpointCompletions.userId, session.user.id)
					)
				)
		}

		return { ok: true }
	} catch {
		return { ok: false, message: 'Save failed' }
	}
}
