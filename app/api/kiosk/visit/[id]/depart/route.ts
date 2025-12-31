// app/api/kiosk/visit/[id]/depart/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitLogs, kioskPeople } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params

	// 👇 NEW: read body
	const body = await req.json().catch(() => ({}))
	const { departureAt } = body

	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// Verify requester is a worker
	const person = await db.query.kioskPeople.findFirst({
		where: eq(kioskPeople.userId, session.user.id),
	})

	if (!person?.isWorkerCached) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	// 👇 NEW: resolve departure time
	const departureDate = departureAt ? new Date(departureAt) : new Date()

	if (isNaN(departureDate.getTime())) {
		return NextResponse.json(
			{ error: 'Invalid departure time' },
			{ status: 400 }
		)
	}

	if (departureDate > new Date()) {
		return NextResponse.json(
			{ error: 'Departure cannot be in the future' },
			{ status: 400 }
		)
	}

	const updated = await db
		.update(kioskVisitLogs)
		.set({ departedAt: departureDate })
		.where(and(eq(kioskVisitLogs.id, id), isNull(kioskVisitLogs.departedAt)))
		.returning({ id: kioskVisitLogs.id })

	if (updated.length === 0) {
		return NextResponse.json({ error: 'Already departed' }, { status: 409 })
	}

	return NextResponse.json({ ok: true })
}
