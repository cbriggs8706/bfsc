// app/[locale]/(app)/cases/page.tsx
import { CaseFeed } from '@/components/cases/CaseFeed'
import { NewCaseSheet } from '@/components/cases/NewCaseSheet'
import { mapCases } from '@/db/mappers/case-mappers'
import { getActiveCaseTypes, getCasesByView } from '@/db/queries/cases'
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
	const view: CaseView = parseCaseView(sp.view, 'open')

	const [rows, caseTypes] = await Promise.all([
		getCasesByView(view, user.id),
		getActiveCaseTypes(),
	])

	const items = mapCases(rows)

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
