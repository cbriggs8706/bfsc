// app/api/kiosk/visit/[id]/depart/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitLogs, kioskPeople } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params

	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const person = await db.query.kioskPeople.findFirst({
		where: eq(kioskPeople.userId, session.user.id),
	})

	if (!person?.isConsultantCached) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	await db
		.update(kioskVisitLogs)
		.set({ departedAt: new Date() })
		.where(eq(kioskVisitLogs.id, id))

	return NextResponse.json({ ok: true })
}
