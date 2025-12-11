// app/api/shifts/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { shiftAssignments } from '@/db/schema/tables/shifts'

export async function POST(req: NextRequest) {
	try {
		const { userId, shiftId } = await req.json()

		if (!userId || !shiftId) {
			return NextResponse.json(
				{ error: 'userId and shiftId are required' },
				{ status: 400 }
			)
		}

		const [inserted] = await db
			.insert(shiftAssignments)
			.values({
				userId,
				shiftId,
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
		const { assignmentId, shiftId } = await req.json()

		if (!assignmentId || !shiftId) {
			return NextResponse.json(
				{ error: 'assignmentId and shiftId are required' },
				{ status: 400 }
			)
		}

		await db
			.update(shiftAssignments)
			.set({ shiftId })
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
