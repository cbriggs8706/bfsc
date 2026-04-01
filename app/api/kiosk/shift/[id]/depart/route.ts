// app/api/kiosk/shift/[id]/depart/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { user } from '@/db/schema/tables/auth'
import { isWorkerRole } from '@/lib/is-worker-role'

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
		columns: {
			id: true,
			userId: true,
			isWorkerCached: true,
		},
		where: eq(kioskPeople.userId, session.user.id),
	})

	const linkedUser =
		person?.userId === null || person?.userId === undefined
			? null
			: await db.query.user.findFirst({
					where: eq(user.id, person.userId),
					columns: { role: true },
				})

	const isWorker =
		linkedUser?.role !== null && linkedUser?.role !== undefined
			? isWorkerRole(linkedUser.role)
			: (person?.isWorkerCached ?? false)

	if (person && person.isWorkerCached !== isWorker) {
		await db
			.update(kioskPeople)
			.set({ isWorkerCached: isWorker, updatedAt: new Date() })
			.where(eq(kioskPeople.id, person.id))
	}

	if (!isWorker) {
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
