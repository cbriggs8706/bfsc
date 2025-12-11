import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitPurposes } from '@/db/schema/tables/kiosk'
import { eq } from 'drizzle-orm'

// ────────────────────────────────
// PUT — update purpose
// ────────────────────────────────
export async function PUT(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const id = Number(params.id)
	const { name, isActive, sortOrder } = await req.json()

	const updateData: any = {}
	if (name !== undefined) updateData.name = name
	if (isActive !== undefined) updateData.isActive = isActive
	if (sortOrder !== undefined) updateData.sortOrder = sortOrder

	const [updated] = await db
		.update(kioskVisitPurposes)
		.set(updateData)
		.where(eq(kioskVisitPurposes.id, id))
		.returning()

	return NextResponse.json({ purpose: updated })
}

// ────────────────────────────────
// DELETE — remove purpose
// ────────────────────────────────
export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const id = Number(params.id)

	await db.delete(kioskVisitPurposes).where(eq(kioskVisitPurposes.id, id))

	return NextResponse.json({ success: true })
}
