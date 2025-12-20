// app/api/shifts/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { shiftAssignments } from '@/db/schema/tables/shifts'

export async function POST(req: NextRequest) {
	try {
		const { userId, shiftRecurrenceId } = await req.json()

		if (!userId || !shiftRecurrenceId) {
			return NextResponse.json(
				{ error: 'userId and shiftRecurrenceId are required' },
				{ status: 400 }
			)
		}

		const [inserted] = await db
			.insert(shiftAssignments)
			.values({
				userId,
				shiftRecurrenceId,
				isPrimary: true,
			})
			.returning({ id: shiftAssignments.id })

		return NextResponse.json({ id: inserted.id })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to create assignment' },
			{ status: 500 }
		)
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const { assignmentId, shiftRecurrenceId } = await req.json()

		if (!assignmentId || !shiftRecurrenceId) {
			return NextResponse.json(
				{ error: 'assignmentId and shiftRecurrenceId are required' },
				{ status: 400 }
			)
		}

		await db
			.update(shiftAssignments)
			.set({ shiftRecurrenceId })
			.where(eq(shiftAssignments.id, assignmentId))

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to update assignment' },
			{ status: 500 }
		)
	}
}
