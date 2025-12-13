// db/queries/cases.ts
import { db, cases, caseWatchers, caseComments, caseTypes } from '@/db'
import { eq, ne, and, lt, or, isNull } from 'drizzle-orm'

export function getMyWatchedCases(userId: string) {
	return db
		.select()
		.from(cases)
		.innerJoin(caseWatchers, eq(caseWatchers.caseId, cases.id))
		.where(and(eq(caseWatchers.userId, userId), ne(cases.status, 'archived')))
}

export function getNeedsAttentionCases() {
	const stale = new Date()
	stale.setHours(stale.getHours() - 8)

	return db
		.select()
		.from(cases)
		.leftJoin(caseComments, eq(caseComments.caseId, cases.id))
		.where(
			and(
				ne(cases.status, 'archived'),
				ne(cases.status, 'solved'),
				or(
					eq(cases.status, 'waiting'),
					isNull(caseComments.createdAt),
					lt(caseComments.createdAt, stale)
				)
			)
		)
}

export function getAllActiveCases() {
	return db
		.select()
		.from(cases)
		.where(ne(cases.status, 'archived'))
		.orderBy(cases.updatedAt)
}

export async function getActiveCaseTypes() {
	return db
		.select()
		.from(caseTypes)
		.where(eq(caseTypes.isActive, true))
		.orderBy(caseTypes.name)
}
