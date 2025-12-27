// app/api/shifts/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { shiftAssignments } from '@/db/schema/tables/shifts'
import { getCurrentUser } from '@/lib/auth'

type AssignmentRole = 'worker' | 'shift_lead' | 'trainer'

/* -----------------------------------------------------
 * Helpers
 * --------------------------------------------------- */

async function requireAdmin() {
	const currentUser = await getCurrentUser()
	if (!currentUser || currentUser.role !== 'Admin') {
		return null
	}
	return currentUser
}

async function assertRoleCapacity(
	shiftRecurrenceId: string,
	role: AssignmentRole
) {
	if (role === 'worker') return

	const limit = role === 'shift_lead' ? 3 : 2

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(shiftAssignments)
		.where(
			and(
				eq(shiftAssignments.shiftRecurrenceId, shiftRecurrenceId),
				eq(shiftAssignments.assignmentRole, role)
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
	const admin = await requireAdmin()
	if (!admin) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		const {
			userId,
			shiftRecurrenceId,
			assignmentRole = 'worker',
			notes = null,
		}: {
			userId: string
			shiftRecurrenceId: string
			assignmentRole?: AssignmentRole
			notes?: string | null
		} = await req.json()

		if (!userId || !shiftRecurrenceId) {
			return NextResponse.json(
				{ error: 'userId and shiftRecurrenceId are required' },
				{ status: 400 }
			)
		}

		await assertRoleCapacity(shiftRecurrenceId, assignmentRole)

		const [inserted] = await db
			.insert(shiftAssignments)
			.values({
				userId,
				shiftRecurrenceId,
				assignmentRole,
				notes,
				isPrimary: true,
			})
			.returning({ id: shiftAssignments.id })

		return NextResponse.json({ id: inserted.id })
	} catch (e: any) {
		console.error(e)
		return NextResponse.json(
			{ error: e?.message ?? 'Failed to create assignment' },
			{ status: 400 }
		)
	}
}

/* -----------------------------------------------------
 * PATCH — move / change role / update notes
 * --------------------------------------------------- */

export async function PATCH(req: NextRequest) {
	const admin = await requireAdmin()
	if (!admin) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		const {
			assignmentId,
			shiftRecurrenceId,
			assignmentRole,
			notes,
		}: {
			assignmentId: string
			shiftRecurrenceId?: string
			assignmentRole?: AssignmentRole
			notes?: string | null
		} = await req.json()

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
		const nextRole = (assignmentRole ??
			existing.assignmentRole) as AssignmentRole

		const recurrenceChanged = nextRecurrenceId !== existing.shiftRecurrenceId
		const roleChanged = nextRole !== existing.assignmentRole

		if ((recurrenceChanged || roleChanged) && nextRole !== 'worker') {
			await assertRoleCapacity(nextRecurrenceId, nextRole)
		}

		await db
			.update(shiftAssignments)
			.set({
				shiftRecurrenceId: shiftRecurrenceId ?? undefined,
				assignmentRole: assignmentRole ?? undefined,
				notes: notes ?? undefined,
			})
			.where(eq(shiftAssignments.id, assignmentId))

		return NextResponse.json({ ok: true })
	} catch (e: any) {
		console.error(e)
		return NextResponse.json(
			{ error: e?.message ?? 'Failed to update assignment' },
			{ status: 400 }
		)
	}
}

/* -----------------------------------------------------
 * DELETE — unassign from shift
 * --------------------------------------------------- */

export async function DELETE(req: NextRequest) {
	const admin = await requireAdmin()
	if (!admin) {
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
