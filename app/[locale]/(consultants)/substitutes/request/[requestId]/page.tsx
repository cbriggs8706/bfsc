// app/[locale]/(consultants)/substitutes/request/[requestId]/page.tsx

import { SubstituteRequest } from '@/components/shifts/SubstituteRequest'
import { getSubstituteRequestDetail } from '@/db/queries/shifts'
import { getAcceptedSubstituteRequests } from '@/db/queries/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

type PageProps = {
	params: Promise<{ requestId: string; locale: string }>
}

export default async function SubstituteRequestPage({ params }: PageProps) {
	const { requestId, locale } = await params
	const { request, volunteers, availabilityMatches } =
		await getSubstituteRequestDetail(requestId)
	const user = await getCurrentUser()
	const t = await getTranslations({ locale, namespace: 'substitutes' })

	const acceptedRequests = user
		? await getAcceptedSubstituteRequests(user.id)
		: []

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('requests')}</h1>
				<p className="text-sm text-muted-foreground">{t('requestsSub')}</p>
			</div>
			<SubstituteRequest
				request={request}
				acceptedRequests={acceptedRequests}
				volunteers={volunteers}
				availabilityMatches={availabilityMatches}
				locale={locale}
			/>{' '}
		</div>
	)
}
