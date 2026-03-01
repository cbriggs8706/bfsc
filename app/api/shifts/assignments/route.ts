// app/api/shifts/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { shiftAssignments } from '@/db/schema/tables/shifts'
import { getCurrentUser } from '@/lib/auth'

type AssignmentRole = 'worker' | 'shift_lead' | 'trainer'
type DbAssignmentRole = AssignmentRole | 'helper' | 'lead'
const EDIT_ROLES = ['Admin', 'Director'] as const
const UI_ROLES = ['worker', 'shift_lead', 'trainer'] as const
const LEGACY_ROLE_CONSTRAINT = 'shift_assignments_role_ck'

const UI_TO_DB_ROLE_CANDIDATES: Record<AssignmentRole, DbAssignmentRole[]> = {
	worker: ['worker', 'helper'],
	shift_lead: ['shift_lead', 'lead'],
	trainer: ['trainer'],
}

/* -----------------------------------------------------
 * Helpers
 * --------------------------------------------------- */

async function requireShiftEditor() {
	const currentUser = await getCurrentUser()
	if (
		!currentUser ||
		!EDIT_ROLES.includes(currentUser.role as (typeof EDIT_ROLES)[number])
	) {
		return null
	}
	return currentUser
}

function toApiErrorMessage(e: unknown, fallback: string) {
	const maybeError = extractPgError(e)

	// Postgres unique violation
	if (maybeError?.code === '23505') {
		return 'This worker is already assigned to that shift recurrence'
	}

	if (
		maybeError?.code === '23514' &&
		maybeError.constraint_name === LEGACY_ROLE_CONSTRAINT
	) {
		return 'Assignment role is incompatible with current database constraint'
	}

	return maybeError?.message ?? fallback
}

function extractPgError(e: unknown):
	| {
		code?: string
		message?: string
		constraint_name?: string
	}
	| null {
	if (!e || typeof e !== 'object') return null

	const direct = e as {
		code?: string
		message?: string
		constraint_name?: string
		cause?: unknown
	}

	if (direct.code || direct.constraint_name) return direct
	if (!direct.cause || typeof direct.cause !== 'object') return direct

	const cause = direct.cause as {
		code?: string
		message?: string
		constraint_name?: string
	}

	return {
		code: cause.code ?? direct.code,
		message: cause.message ?? direct.message,
		constraint_name: cause.constraint_name ?? direct.constraint_name,
	}
}

function isUiAssignmentRole(value: string): value is AssignmentRole {
	return (UI_ROLES as readonly string[]).includes(value)
}

function parseUiAssignmentRole(value: unknown): AssignmentRole {
	if (typeof value !== 'string' || !isUiAssignmentRole(value)) {
		throw new Error('Invalid assignmentRole')
	}
	return value
}

function toUiRole(dbRole: string): AssignmentRole {
	if (dbRole === 'helper') return 'worker'
	if (dbRole === 'lead') return 'shift_lead'
	if (isUiAssignmentRole(dbRole)) return dbRole
	return 'worker'
}

function isLegacyRoleConstraintError(e: unknown) {
	const maybeError = extractPgError(e)
	return (
		maybeError?.code === '23514' &&
		maybeError.constraint_name === LEGACY_ROLE_CONSTRAINT
	)
}

async function assertRoleCapacity(
	shiftRecurrenceId: string,
	role: AssignmentRole
) {
	if (role === 'worker') return

	const limit = role === 'shift_lead' ? 3 : 2
	const dbRoleCandidates = UI_TO_DB_ROLE_CANDIDATES[role]

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(shiftAssignments)
		.where(
			and(
				eq(shiftAssignments.shiftRecurrenceId, shiftRecurrenceId),
				inArray(shiftAssignments.assignmentRole, dbRoleCandidates)
			)
		)

	if (Number(count) >= limit) {
		throw new Error(`Maximum ${limit} ${role.replace('_', ' ')}s allowed`)
	}
}

/* -----------------------------------------------------
 * POST — create assignment
 * --------------------------------------------------- */

export async function POST(req: NextRequest) {
	const editor = await requireShiftEditor()
	if (!editor) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		const {
			userId,
			shiftRecurrenceId,
			assignmentRole: assignmentRoleRaw = 'worker',
			notes = null,
		}: {
			userId: string
			shiftRecurrenceId: string
			assignmentRole?: string
			notes?: string | null
		} = await req.json()
		const assignmentRole = parseUiAssignmentRole(assignmentRoleRaw)

		if (!userId || !shiftRecurrenceId) {
			return NextResponse.json(
				{ error: 'userId and shiftRecurrenceId are required' },
				{ status: 400 }
			)
		}

		await assertRoleCapacity(shiftRecurrenceId, assignmentRole)

		const [primaryRole, fallbackRole] = UI_TO_DB_ROLE_CANDIDATES[assignmentRole]
		let inserted: { id: string } | undefined

		try {
			;[inserted] = await db
				.insert(shiftAssignments)
				.values({
					userId,
					shiftRecurrenceId,
					assignmentRole: primaryRole,
					notes,
					isPrimary: true,
				})
				.returning({ id: shiftAssignments.id })
		} catch (e) {
			if (!fallbackRole || !isLegacyRoleConstraintError(e)) throw e

			;[inserted] = await db
				.insert(shiftAssignments)
				.values({
					userId,
					shiftRecurrenceId,
					assignmentRole: fallbackRole,
					notes,
					isPrimary: true,
				})
				.returning({ id: shiftAssignments.id })
		}

		return NextResponse.json({ id: inserted.id })
	} catch (e: unknown) {
		console.error(e)
		return NextResponse.json(
			{ error: toApiErrorMessage(e, 'Failed to create assignment') },
			{ status: 400 }
		)
	}
}

/* -----------------------------------------------------
 * PATCH — move / change role / update notes
 * --------------------------------------------------- */

export async function PATCH(req: NextRequest) {
	const editor = await requireShiftEditor()
	if (!editor) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		const {
			assignmentId,
			shiftRecurrenceId,
			assignmentRole: assignmentRoleRaw,
			notes,
		}: {
			assignmentId: string
			shiftRecurrenceId?: string
			assignmentRole?: string
			notes?: string | null
		} = await req.json()
		const assignmentRole = assignmentRoleRaw
			? parseUiAssignmentRole(assignmentRoleRaw)
			: undefined

		if (!assignmentId) {
			return NextResponse.json(
				{ error: 'assignmentId is required' },
				{ status: 400 }
			)
		}

		// Load existing assignment
		const [existing] = await db
			.select({
				id: shiftAssignments.id,
				shiftRecurrenceId: shiftAssignments.shiftRecurrenceId,
				assignmentRole: shiftAssignments.assignmentRole,
			})
			.from(shiftAssignments)
			.where(eq(shiftAssignments.id, assignmentId))

		if (!existing) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const nextRecurrenceId = shiftRecurrenceId ?? existing.shiftRecurrenceId
		const existingUiRole = toUiRole(existing.assignmentRole)
		const nextRole = assignmentRole ?? existingUiRole

		const recurrenceChanged = nextRecurrenceId !== existing.shiftRecurrenceId
		const roleChanged = nextRole !== existingUiRole

		if ((recurrenceChanged || roleChanged) && nextRole !== 'worker') {
			await assertRoleCapacity(nextRecurrenceId, nextRole)
		}

		if (!assignmentRole) {
			await db
				.update(shiftAssignments)
				.set({
					shiftRecurrenceId: shiftRecurrenceId ?? undefined,
					notes: notes ?? undefined,
				})
				.where(eq(shiftAssignments.id, assignmentId))
		} else {
			const [primaryRole, fallbackRole] = UI_TO_DB_ROLE_CANDIDATES[assignmentRole]
			try {
				await db
					.update(shiftAssignments)
					.set({
						shiftRecurrenceId: shiftRecurrenceId ?? undefined,
						assignmentRole: primaryRole,
						notes: notes ?? undefined,
					})
					.where(eq(shiftAssignments.id, assignmentId))
			} catch (e) {
				if (!fallbackRole || !isLegacyRoleConstraintError(e)) throw e

				await db
					.update(shiftAssignments)
					.set({
						shiftRecurrenceId: shiftRecurrenceId ?? undefined,
						assignmentRole: fallbackRole,
						notes: notes ?? undefined,
					})
					.where(eq(shiftAssignments.id, assignmentId))
			}
		}

		return NextResponse.json({ ok: true })
	} catch (e: unknown) {
		console.error(e)
		return NextResponse.json(
			{ error: toApiErrorMessage(e, 'Failed to update assignment') },
			{ status: 400 }
		)
	}
}

/* -----------------------------------------------------
 * DELETE — unassign from shift
 * --------------------------------------------------- */

export async function DELETE(req: NextRequest) {
	const editor = await requireShiftEditor()
	if (!editor) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		const { assignmentId }: { assignmentId: string } = await req.json()

		if (!assignmentId) {
			return NextResponse.json(
				{ error: 'assignmentId is required' },
				{ status: 400 }
			)
		}

		await db
			.delete(shiftAssignments)
			.where(eq(shiftAssignments.id, assignmentId))

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to delete assignment' },
			{ status: 500 }
		)
	}
}
