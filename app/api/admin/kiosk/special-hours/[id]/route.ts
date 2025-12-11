import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialHours } from '@/db'
import { eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, context: RouteContext) {
	const { id } = await context.params

	await db.delete(specialHours).where(eq(specialHours.id, id))

	return NextResponse.json({ success: true })
}
