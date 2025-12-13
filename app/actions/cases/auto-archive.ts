// app/actions/cases/auto-archive.ts
'use server'

import { db, cases } from '@/db'
import { and, eq, lt } from 'drizzle-orm'

export async function autoArchiveCases() {
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - 14)

	await db
		.update(cases)
		.set({
			status: 'archived',
			archivedAt: new Date(),
		})
		.where(and(eq(cases.status, 'solved'), lt(cases.solvedAt, cutoff)))
}
