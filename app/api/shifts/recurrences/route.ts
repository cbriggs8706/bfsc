// app/api/shifts/recurrences/route.ts
import { db, shiftRecurrences } from '@/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
	const { id, ...updates } = await req.json()

	await db
		.update(shiftRecurrences)
		.set(updates)
		.where(eq(shiftRecurrences.id, id))

	return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
	const {
		shiftId,
		label = 'Every week',
		weekOfMonth = null,
		sortOrder = 0,
	} = await req.json()

	const [recurrence] = await db
		.insert(shiftRecurrences)
		.values({
			shiftId,
			label,
			weekOfMonth,
			sortOrder,
		})
		.returning()

	return NextResponse.json(recurrence)
}

export async function DELETE(req: NextRequest) {
	const { id } = await req.json()

	await db.delete(shiftRecurrences).where(eq(shiftRecurrences.id, id))

	return NextResponse.json({ ok: true })
}
