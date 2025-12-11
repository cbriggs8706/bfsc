import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskSpecialHours } from '@/db/schema/tables/kiosk'
import { eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, context: RouteContext) {
	const { id } = await context.params

	await db.delete(kioskSpecialHours).where(eq(kioskSpecialHours.id, id))

	return NextResponse.json({ success: true })
}
