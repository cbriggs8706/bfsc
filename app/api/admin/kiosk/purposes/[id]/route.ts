// app/api/admin/kiosk/purposes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitPurposes } from '@/db/schema/tables/kiosk'
import { eq } from 'drizzle-orm'

type RouteContext = {
	params: Promise<{ id: string }>
}
// ────────────────────────────────
// PUT — update purpose
// ────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteContext) {
	const { id } = await params
	const numericId = Number(id)

	const { name, isActive, sortOrder } = (await req.json()) as {
		name?: string
		isActive?: boolean
		sortOrder?: number
	}

	const updateData: Partial<{
		name: string
		isActive: boolean
		sortOrder: number
	}> = {}
	if (name !== undefined) updateData.name = name
	if (isActive !== undefined) updateData.isActive = isActive
	if (sortOrder !== undefined) updateData.sortOrder = sortOrder

	const [updated] = await db
		.update(kioskVisitPurposes)
		.set(updateData)
		.where(eq(kioskVisitPurposes.id, numericId))
		.returning()

	return NextResponse.json({ purpose: updated })
}

// ────────────────────────────────
// DELETE — remove purpose
// ────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
	const { id } = await params
	const numericId = Number(id)

	await db
		.delete(kioskVisitPurposes)
		.where(eq(kioskVisitPurposes.id, numericId))

	return NextResponse.json({ success: true })
}
