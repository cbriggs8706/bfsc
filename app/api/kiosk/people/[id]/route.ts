import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { normalizeFullNameForStorage } from '@/lib/names'
import { isWorkerRole } from '@/lib/is-worker-role'

type RouteContext = {
	params: Promise<{
		id: string
	}>
}

export async function PATCH(req: Request, context: RouteContext) {
	const { id } = await context.params
	const body = (await req.json()) as { fullName?: string }
	const fullName = body.fullName?.trim() ?? ''

	if (!fullName) {
		return NextResponse.json(
			{ error: 'A name is required.' },
			{ status: 400 }
		)
	}

	const normalizedFullName = normalizeFullNameForStorage(fullName)

	const [updated] = await db
		.update(kioskPeople)
		.set({
			fullName: normalizedFullName,
			updatedAt: new Date(),
		})
		.where(eq(kioskPeople.id, id))
		.returning({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
			passcode: kioskPeople.passcode,
			isWorkerCached: kioskPeople.isWorkerCached,
		})

	if (!updated) {
		return NextResponse.json({ error: 'Person not found.' }, { status: 404 })
	}

	const linkedUser =
		updated.userId === null
			? null
			: await db.query.user.findFirst({
					where: eq(user.id, updated.userId),
					columns: { role: true },
				})

	return NextResponse.json({
		person: {
			id: updated.id,
			fullName: updated.fullName,
			userId: updated.userId,
			isWorker:
				linkedUser?.role !== null && linkedUser?.role !== undefined
					? isWorkerRole(linkedUser.role)
					: updated.isWorkerCached,
			hasPasscode: Boolean(updated.passcode),
		},
	})
}
