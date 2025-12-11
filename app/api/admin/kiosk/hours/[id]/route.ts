import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { operatingHours } from '@/db'
import { eq } from 'drizzle-orm'

const timeRegex = /^[0-2][0-9]:[0-5][0-9]$/

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
	const { id } = await context.params
	const body = await req.json()

	//------------------------------------------------------------
	// 1. Handle marking a day as closed
	//------------------------------------------------------------
	if (body.isClosed === true) {
		await db
			.update(operatingHours)
			.set({
				isClosed: true,
				opensAt: '00:00',
				closesAt: '00:00',
			})
			.where(eq(operatingHours.id, id))

		return NextResponse.json({ success: true })
	}

	//------------------------------------------------------------
	// 2. Handle reopening a day (isClosed === false)
	//------------------------------------------------------------
	if (body.isClosed === false) {
		// Do NOT reset hours; admin will adjust times later
		await db
			.update(operatingHours)
			.set({
				isClosed: false,
			})
			.where(eq(operatingHours.id, id))

		return NextResponse.json({ success: true })
	}

	//------------------------------------------------------------
	// 3. Partial updates for times
	//------------------------------------------------------------
	const update: Record<string, unknown> = {}

	if (body.opensAt !== undefined) {
		if (!timeRegex.test(body.opensAt)) {
			return NextResponse.json(
				{ error: 'Invalid opensAt. Expected HH:MM.' },
				{ status: 400 }
			)
		}
		update.opensAt = body.opensAt
	}

	if (body.closesAt !== undefined) {
		if (!timeRegex.test(body.closesAt)) {
			return NextResponse.json(
				{ error: 'Invalid closesAt. Expected HH:MM.' },
				{ status: 400 }
			)
		}
		update.closesAt = body.closesAt
	}

	// If both are present, enforce ordering
	if (update.opensAt && update.closesAt) {
		if (update.opensAt >= update.closesAt) {
			return NextResponse.json(
				{ error: 'Opening time must be earlier than closing time.' },
				{ status: 400 }
			)
		}
	}

	// If updating times, ensure day is marked open
	if ('opensAt' in update || 'closesAt' in update) {
		update.isClosed = false
	}

	if (Object.keys(update).length === 0) {
		return NextResponse.json(
			{ error: 'No valid fields to update.' },
			{ status: 400 }
		)
	}

	await db.update(operatingHours).set(update).where(eq(operatingHours.id, id))

	return NextResponse.json({ success: true })
}
