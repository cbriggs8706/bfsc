// app/actions/cases/reopen-case.ts
'use server'

import { db } from '@/db'
import { cases } from '@/db'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function reopenCase(caseId: string) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	// Optional: permission check
	// if (user.role !== 'Admin') throw new Error('Forbidden')

	await db.update(cases).set({ status: 'open' }).where(eq(cases.id, caseId))
}
