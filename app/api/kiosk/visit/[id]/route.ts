import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitLogs, kioskPeople } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
	_req: Request,
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

	if (!person?.isWorkerCached) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const deleted = await db
		.delete(kioskVisitLogs)
		.where(eq(kioskVisitLogs.id, id))
		.returning({ id: kioskVisitLogs.id })

	if (deleted.length === 0) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ ok: true })
}
