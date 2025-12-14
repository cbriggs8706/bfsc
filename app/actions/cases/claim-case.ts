// app/actions/cases/claim-case.ts

import { db, cases, caseInvestigators } from '@/db'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ClaimResult = { ok: true } | { ok: false; error: string }

export async function claimCase(
	caseId: string,
	userId: string,
	locale: string
): Promise<ClaimResult> {
	try {
		await db.transaction(async (tx) => {
			// 1) add investigator link (no duplicates)
			await tx
				.insert(caseInvestigators)
				.values({ caseId, userId })
				.onConflictDoNothing()

			// 2) move case to investigating if it isn't already archived
			await tx
				.update(cases)
				.set({ status: 'investigating' })
				.where(and(eq(cases.id, caseId), sql`${cases.status} <> 'archived'`))
		})

		revalidatePath(`/${locale}/cases/${caseId}`)
		revalidatePath(`/${locale}/cases`)

		return { ok: true }
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error'
		return { ok: false, error: message }
	}
}

export async function unclaimCase(
	caseId: string,
	userId: string,
	locale: string
): Promise<ClaimResult> {
	try {
		await db.transaction(async (tx) => {
			// 1) remove investigator link
			await tx
				.delete(caseInvestigators)
				.where(
					and(
						eq(caseInvestigators.caseId, caseId),
						eq(caseInvestigators.userId, userId)
					)
				)

			// 2) if no investigators remain and case is investigating, revert to open
			const remaining = await tx
				.select({ count: sql<number>`count(*)` })
				.from(caseInvestigators)
				.where(eq(caseInvestigators.caseId, caseId))

			const remainingCount = remaining[0]?.count ?? 0

			if (remainingCount === 0) {
				await tx
					.update(cases)
					.set({ status: 'open' })
					.where(and(eq(cases.id, caseId), eq(cases.status, 'investigating')))
			}
		})

		revalidatePath(`/${locale}/cases/${caseId}`)
		revalidatePath(`/${locale}/cases`)

		return { ok: true }
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error'
		return { ok: false, error: message }
	}
}
