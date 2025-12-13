// app/actions/cases/mark-solved.ts
'use server'

import { db, cases } from '@/db'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function markCaseSolved(caseId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const [current] = await db.select().from(cases).where(eq(cases.id, caseId))

	if (!current) throw new Error('Case not found')

	const canSolve = current.createdByUserId === user.id || user.role === 'Admin'

	if (!canSolve) throw new Error('Forbidden')

	await db
		.update(cases)
		.set({
			status: 'solved',
			solvedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(cases.id, caseId))
}
