// app/api/kiosk/shift/[id]/depart/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
	const body = await req.json().catch(() => ({}))
	const { departureAt } = body

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

	const departureDate = departureAt ? new Date(departureAt) : new Date()

	if (isNaN(departureDate.getTime())) {
		return NextResponse.json(
			{ error: 'Invalid departure time' },
			{ status: 400 }
		)
	}

	await db
		.update(kioskShiftLogs)
		.set({ actualDepartureAt: departureDate })
		.where(eq(kioskShiftLogs.id, id))

	return NextResponse.json({ ok: true })
}
