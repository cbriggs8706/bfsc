// app/api/consultants/active-duty/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: Request) {
	const current = await getCurrentUser()
	if (!current || current.role !== 'Admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const body = await req.json()
	const {
		userId,
		isActiveConsultant,
	}: { userId: string; isActiveConsultant: boolean } = body

	await db.update(user).set({ isActiveConsultant }).where(eq(user.id, userId))

	return NextResponse.json({ ok: true })
}
