// db/queries/cases.ts
import {
	db,
	cases,
	caseWatchers,
	caseComments,
	caseTypes,
	user,
	caseInvestigators,
} from '@/db'
import { CaseView } from '@/lib/cases/views'
import { eq, ne, and, lt, or, isNull, count, gt } from 'drizzle-orm'

// export function getMyWatchedCases(userId: string) {
// 	return db
// 		.select({
// 			cases,
// 			users: { name: user.name },
// 			case_types: {
// 				name: caseTypes.name,
// 				icon: caseTypes.icon,
// 				color: caseTypes.color,
// 			},
// 			commentCount: count(caseComments.id),
// 		})
// 		.from(cases)
// 		.innerJoin(caseWatchers, eq(caseWatchers.caseId, cases.id))
// 		.leftJoin(user, eq(user.id, cases.createdByUserId))
// 		.leftJoin(caseTypes, eq(caseTypes.id, cases.typeId))
// 		.leftJoin(caseComments, eq(caseComments.caseId, cases.id))
// 		.where(and(eq(caseWatchers.userId, userId), ne(cases.status, 'archived')))
// 		.groupBy(cases.id, user.name, caseTypes.id)
// }

export function getNeedsAttentionCases() {
	const stale = new Date()
	stale.setHours(stale.getHours() - 8)

	return db
		.select({
			cases,
			users: { name: user.name },
			case_types: {
				name: caseTypes.name,
				icon: caseTypes.icon,
				color: caseTypes.color,
			},
			commentCount: count(caseComments.id),
		})
		.from(cases)
		.leftJoin(user, eq(user.id, cases.createdByUserId))
		.leftJoin(caseTypes, eq(caseTypes.id, cases.typeId))
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
		.groupBy(cases.id, user.name, caseTypes.id)
}

// export function getAllActiveCases() {
// 	return db
// 		.select({
// 			cases,
// 			users: { name: user.name },
// 			case_types: {
// 				name: caseTypes.name,
// 				icon: caseTypes.icon,
// 				color: caseTypes.color,
// 			},
// 			commentCount: count(caseComments.id),
// 		})
// 		.from(cases)
// 		.leftJoin(user, eq(user.id, cases.createdByUserId))
// 		.leftJoin(caseTypes, eq(caseTypes.id, cases.typeId))
// 		.leftJoin(caseComments, eq(caseComments.caseId, cases.id))
// 		.where(ne(cases.status, 'archived'))
// 		.groupBy(cases.id, user.name, caseTypes.id)
// 		.orderBy(cases.updatedAt)
// }

export async function getActiveCaseTypes() {
	return db
		.select()
		.from(caseTypes)
		.where(eq(caseTypes.isActive, true))
		.orderBy(caseTypes.name)
}

export async function getCasesByView(view: CaseView, userId: string) {
	const base = db
		.select({
			cases,
			users: { name: user.name },
			case_types: {
				name: caseTypes.name,
				icon: caseTypes.icon,
				color: caseTypes.color,
			},
			commentCount: count(caseComments.id),
		})
		.from(cases)
		.leftJoin(user, eq(user.id, cases.createdByUserId))
		.leftJoin(caseTypes, eq(caseTypes.id, cases.typeId))
		.leftJoin(caseComments, eq(caseComments.caseId, cases.id))

	switch (view) {
		case 'open':
			return base
				.where(eq(cases.status, 'open'))
				.groupBy(cases.id, user.name, caseTypes.id)

		case 'investigating':
			return base
				.where(eq(cases.status, 'investigating'))
				.groupBy(cases.id, user.name, caseTypes.id)

		case 'myInvestigating':
			return base
				.innerJoin(caseInvestigators, eq(caseInvestigators.caseId, cases.id))
				.where(
					and(
						eq(cases.status, 'investigating'),
						eq(caseInvestigators.userId, userId)
					)
				)
				.groupBy(cases.id, user.name, caseTypes.id)

		case 'waiting':
			return base
				.where(eq(cases.status, 'waiting'))
				.groupBy(cases.id, user.name, caseTypes.id)

		case 'solved': {
			const cutoff = new Date()
			cutoff.setDate(cutoff.getDate() - 13)

			return base
				.where(and(eq(cases.status, 'solved'), gt(cases.solvedAt, cutoff)))
				.groupBy(cases.id, user.name, caseTypes.id)
		}

		case 'archived':
			return base
				.where(eq(cases.status, 'archived'))
				.groupBy(cases.id, user.name, caseTypes.id)

		case 'watching':
			return base
				.innerJoin(caseWatchers, eq(caseWatchers.caseId, cases.id))
				.where(eq(caseWatchers.userId, userId))
				.groupBy(cases.id, user.name, caseTypes.id)

		// 🔒 SAFETY NET — never hit, but satisfies TS
		default:
			return []
	}
}

export async function isUserInvestigating(
	caseId: string,
	userId: string
): Promise<boolean> {
	const rows = await db
		.select({ userId: caseInvestigators.userId })
		.from(caseInvestigators)
		.where(
			and(
				eq(caseInvestigators.caseId, caseId),
				eq(caseInvestigators.userId, userId)
			)
		)
		.limit(1)

	return rows.length > 0
}

export async function getDashboardCases() {
	return db
		.select({
			cases,
			users: { name: user.name },
			case_types: {
				id: caseTypes.id,
				name: caseTypes.name,
				icon: caseTypes.icon,
				color: caseTypes.color,
			},
			commentCount: count(caseComments.id),
		})
		.from(cases)
		.leftJoin(user, eq(user.id, cases.createdByUserId))
		.leftJoin(caseTypes, eq(caseTypes.id, cases.typeId))
		.leftJoin(caseComments, eq(caseComments.caseId, cases.id))
		.where(ne(cases.status, 'archived'))
		.groupBy(cases.id, user.name, caseTypes.id)
		.orderBy(caseTypes.name, cases.updatedAt)
}
