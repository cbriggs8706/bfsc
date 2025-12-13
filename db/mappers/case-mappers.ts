// db/mappers/case-mappers.ts
import { cases, caseTypes, user } from '@/db'
import { InferSelectModel } from 'drizzle-orm'

export type CaseFeedItem = {
	id: string
	title: string
	status: string
	updatedAt: Date
	submitterName: string
	commentCount: number
	type: {
		name: string
		icon?: string
		color?: string
	}
}

type CaseRow = InferSelectModel<typeof cases>

type JoinedCaseRow = {
	cases: CaseRow
	users?: Pick<InferSelectModel<typeof user>, 'name'> | null
	case_types?: Pick<
		InferSelectModel<typeof caseTypes>,
		'name' | 'icon' | 'color'
	> | null
	commentCount?: number
}

type MapCaseInput = CaseRow | JoinedCaseRow

export function mapCases(rows: MapCaseInput[]): CaseFeedItem[] {
	return rows.map((r) => {
		const c = 'cases' in r ? r.cases : r

		return {
			id: c.id,
			title: c.title,
			status: c.status,
			updatedAt: c.updatedAt,
			submitterName: 'users' in r && r.users?.name ? r.users.name : 'Unknown',
			commentCount:
				'commentCount' in r && typeof r.commentCount === 'number'
					? r.commentCount
					: 0,
			type: {
				name:
					'case_types' in r && r.case_types?.name ? r.case_types.name : 'Case',
				icon: 'case_types' in r ? r.case_types?.icon ?? undefined : undefined,
				color: 'case_types' in r ? r.case_types?.color ?? undefined : undefined,
			},
		}
	})
}
