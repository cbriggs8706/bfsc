// app/[locale]/(consultants)/cases/page.tsx
import { CaseFeed, CaseItem } from '@/components/cases/CaseFeed'
import { NewCaseSheet } from '@/components/cases/NewCaseSheet'
import { mapCases } from '@/db/mappers/case-mappers'
import {
	getActiveCaseTypes,
	getCasesByView,
	getDashboardCases,
} from '@/db/queries/cases'
import { getCurrentUser } from '@/lib/auth'
import { CaseView, parseCaseView, titleCaseView } from '@/lib/cases/views'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'

interface Props {
	params: Promise<{ locale: string }>
	searchParams?: Promise<{ view?: string }>
}

export default async function CasesPage({ params, searchParams }: Props) {
	const { locale } = await params

	const user = await getCurrentUser()
	if (!user) redirect('/login')

	const sp = (await searchParams) ?? {}
	const view: CaseView = parseCaseView(sp.view, 'dashboard')

	const [rows, caseTypes] = await Promise.all([
		view === 'dashboard' ? getDashboardCases() : getCasesByView(view, user.id),
		getActiveCaseTypes(),
	])

	const items = mapCases(rows)

	function groupByCaseType(items: CaseItem[]) {
		return items.reduce<Record<string, CaseItem[]>>((acc, item) => {
			const key = item.type.name
			if (!acc[key]) acc[key] = []
			acc[key].push(item)
			return acc
		}, {})
	}

	if (view === 'dashboard') {
		const grouped = groupByCaseType(items)

		return (
			<div className="p-4 space-y-8">
				<h1 className="text-3xl font-bold">Cases</h1>

				{Object.entries(grouped).map(([typeName, cases]) => (
					<section key={typeName} className="space-y-3">
						<h2 className="text-xl font-semibold">{typeName}</h2>
						<CaseFeed items={cases} locale={locale} />
					</section>
				))}

				<NewCaseSheet caseTypes={caseTypes} locale={locale} />
			</div>
		)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Cases</h1>
				<p className="text-sm text-muted-foreground">
					{titleCaseView(view)} cases
				</p>
			</div>

			<CaseFeed items={items} locale={locale} />
			<NewCaseSheet caseTypes={caseTypes} locale={locale} />
		</div>
	)
}
