// app/[locale]/(app)/cases/page.tsx
import { CaseFeed } from '@/components/cases/CaseFeed'
import { NewCaseSheet } from '@/components/cases/NewCaseSheet'
import { mapCases } from '@/db/mappers/case-mappers'
import { getActiveCaseTypes, getMyWatchedCases } from '@/db/queries/cases'
import { getNeedsAttentionCases } from '@/db/queries/cases'
import { getAllActiveCases } from '@/db/queries/cases'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CasesPage({ params }: Props) {
	const { locale } = await params

	const user = await getCurrentUser()
	if (!user) redirect('/login')

	const [watched, needsAttention, allActive, caseTypes] = await Promise.all([
		getMyWatchedCases(user.id),
		getNeedsAttentionCases(),
		getAllActiveCases(),
		getActiveCaseTypes(),
	])

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Cases</h1>
				<p className="text-sm text-muted-foreground">
					Help each other solve mysteries.
				</p>
			</div>
			<CaseFeed
				watched={mapCases(watched)}
				needsAttention={mapCases(needsAttention)}
				allActive={mapCases(allActive)}
				locale={locale}
			/>
			<NewCaseSheet caseTypes={caseTypes} locale={locale} />
		</div>
	)
}
