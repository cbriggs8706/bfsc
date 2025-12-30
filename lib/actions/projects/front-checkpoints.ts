'use server'

import { db } from '@/db'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	projectCheckpoints,
	projectCheckpointContributions,
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

/* ------------------------------------------------------------------
   READ CHECKPOINT DETAIL
------------------------------------------------------------------ */
export async function readCheckpointDetail(
	locale: string,
	checkpointId: string
): Promise<CheckpointDetail | null> {
	const checkpoint = await db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, checkpointId),
	})

	if (!checkpoint) return null

	// Admin check (exact rule you gave)
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
		estimatedDuration: String(checkpoint.estimatedDuration ?? 0),

		isCompleted: checkpoint.isCompleted,

		// editable if not completed OR admin
		canEdit: !checkpoint.isCompleted || isAdmin,
	}
}

/* ------------------------------------------------------------------
   READ PROJECT CHECKPOINT LIST
------------------------------------------------------------------ */
export async function readProjectCheckpoints(
	projectId: string
): Promise<ProjectCheckpointRow[]> {
	const rows = await db
		.select({
			id: projectCheckpoints.id,
			name: projectCheckpoints.name,
			url: projectCheckpoints.url,
			isCompleted: projectCheckpoints.isCompleted,
			estimatedDuration: projectCheckpoints.estimatedDuration,

			totalMinutes: sql<number>`
				COALESCE(SUM(${projectCheckpointContributions.minutesSpent}), 0)
			`,
		})
		.from(projectCheckpoints)
		.leftJoin(
			projectCheckpointContributions,
			eq(projectCheckpointContributions.checkpointId, projectCheckpoints.id)
		)
		.where(eq(projectCheckpoints.projectId, projectId))
		.groupBy(projectCheckpoints.id)
		.orderBy(projectCheckpoints.sortOrder)

	return rows
}

/* ------------------------------------------------------------------
   FORM-SHAPED READ (USER CONTRIBUTION ONLY)
------------------------------------------------------------------ */
export async function readCheckpointContributionForForm(checkpointId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	// Most recent contribution by this user (optional UX choice)
	const row = await db
		.select({
			minutesSpent: projectCheckpointContributions.minutesSpent,
		})
		.from(projectCheckpointContributions)
		.where(
			and(
				eq(projectCheckpointContributions.checkpointId, checkpointId),
				eq(projectCheckpointContributions.userId, session.user.id)
			)
		)
		.orderBy(sql`${projectCheckpointContributions.createdAt} DESC`)
		.limit(1)

	if (!row[0]) return null

	return {
		minutesSpent: String(row[0].minutesSpent),
	}
}

/* ------------------------------------------------------------------
   SAVE TIME CONTRIBUTION (ALWAYS APPENDS)
------------------------------------------------------------------ */
export async function saveCheckpointContribution(
	checkpointId: string,
	raw: unknown,
	locale: string,
	options?: { markComplete?: boolean }
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

	const checkpoint = await db.query.projectCheckpoints.findFirst({
		where: eq(projectCheckpoints.id, checkpointId),
	})

	if (!checkpoint) {
		return { ok: false, message: 'Checkpoint not found' }
	}

	// Admin check
	const isAdmin = await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)
		.then(() => true)
		.catch(() => false)

	// Non-admins cannot add time once completed
	if (checkpoint.isCompleted && !isAdmin) {
		return { ok: false, message: 'Checkpoint is locked' }
	}

	try {
		await db.transaction(async (tx) => {
			// 1️⃣ Add contribution
			await tx.insert(projectCheckpointContributions).values({
				checkpointId,
				userId: session.user.id,
				minutesSpent,
			})

			// 2️⃣ Optionally mark complete
			if (options?.markComplete) {
				await tx
					.update(projectCheckpoints)
					.set({ isCompleted: true })
					.where(eq(projectCheckpoints.id, checkpointId))
			}
		})

		return { ok: true }
	} catch {
		return { ok: false, message: 'Save failed' }
	}
}

/* ------------------------------------------------------------------
   MARK CHECKPOINT COMPLETE (ADMIN ONLY)
------------------------------------------------------------------ */
export async function completeCheckpoint(
	checkpointId: string,
	locale: string
): Promise<CheckpointFormResult> {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return { ok: false, message: 'Unauthorized' }
	}

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	try {
		await db
			.update(projectCheckpoints)
			.set({
				isCompleted: true,
				completedAt: new Date(),
				completedByUserId: session.user.id,
			})
			.where(eq(projectCheckpoints.id, checkpointId))

		return { ok: true }
	} catch {
		return { ok: false, message: 'Complete failed' }
	}
}

/* ------------------------------------------------------------------
   REOPEN CHECKPOINT (ADMIN ONLY)
------------------------------------------------------------------ */
export async function reopenCheckpoint(
	checkpointId: string,
	locale: string
): Promise<CheckpointFormResult> {
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	try {
		await db
			.update(projectCheckpoints)
			.set({
				isCompleted: false,
				completedAt: null,
				completedByUserId: null,
			})
			.where(eq(projectCheckpoints.id, checkpointId))

		return { ok: true }
	} catch {
		return { ok: false, message: 'Reopen failed' }
	}
}
