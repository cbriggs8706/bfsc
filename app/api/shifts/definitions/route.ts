// app/api/shifts/definitions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { weeklyShifts } from '@/db/schema/tables/shifts'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
	try {
		const { weekday, startTime, endTime, isActive, notes } = await req.json()

		if (
			weekday === undefined ||
			typeof startTime !== 'string' ||
			typeof endTime !== 'string'
		) {
			return NextResponse.json(
				{ error: 'weekday, startTime, and endTime are required' },
				{ status: 400 }
			)
		}

		const [inserted] = await db
			.insert(weeklyShifts)
			.values({
				weekday,
				startTime,
				endTime,
				isActive: isActive ?? true,
				notes: notes ?? null,
			})
			.returning({ id: weeklyShifts.id })

		return NextResponse.json({ id: inserted.id })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to create shift' },
			{ status: 500 }
		)
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json()
		const { id, weekday, startTime, endTime, isActive, notes } = body

		if (!id) {
			return NextResponse.json({ error: 'id is required' }, { status: 400 })
		}

		const updates: Partial<typeof weeklyShifts.$inferInsert> = {}

		if (weekday !== undefined) updates.weekday = weekday
		if (typeof startTime === 'string') updates.startTime = startTime
		if (typeof endTime === 'string') updates.endTime = endTime
		if (typeof isActive === 'boolean') updates.isActive = isActive
		if (notes !== undefined) updates.notes = notes === '' ? null : notes

		if (Object.keys(updates).length === 0) {
			return NextResponse.json(
				{ error: 'No fields to update' },
				{ status: 400 }
			)
		}

		await db.update(weeklyShifts).set(updates).where(eq(weeklyShifts.id, id))

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to update shift' },
			{ status: 500 }
		)
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { id } = await req.json()
		if (!id) {
			return NextResponse.json({ error: 'id is required' }, { status: 400 })
		}

		await db.delete(weeklyShifts).where(eq(weeklyShifts.id, id))

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Failed to delete shift' },
			{ status: 500 }
		)
	}
}
