// app/[locale]/(workers)/substitutes/calendar/page.tsx

import { SubstituteCalendarClient } from '@/components/shifts/SubstituteCalendar'
import { getOpenSubstituteRequests } from '@/db/queries/shifts'
import {
	getAcceptedSubstituteRequests,
	getMyNominatedRequests,
} from '@/db/queries/substitutes'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function SubstituteCalendarPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'substitutes' })

	const user = await getCurrentUser()
	if (!user) {
		redirect(`/${locale}`)
	}

	const openRequests = user ? await getOpenSubstituteRequests(user.id) : []
	const myNominations = user ? await getMyNominatedRequests(user.id) : []
	const acceptedRequests = user
		? await getAcceptedSubstituteRequests(user.id)
		: []

	// console.log(
	// 	'openRequests (calendar input):',
	// 	openRequests.map((r) => ({
	// 		id: r.id,
	// 		hasVolunteeredByMe: (r as any).hasVolunteeredByMe,
	// 	}))
	// )

	// console.log('acceptedRequests', acceptedRequests)
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{t('calendar')}</h1>
				<p className="text-sm text-muted-foreground">{t('calendarSub')}</p>
			</div>

			<SubstituteCalendarClient
				requests={openRequests}
				nominations={myNominations}
				acceptedRequests={acceptedRequests}
				currentUserId={user.id}
				locale={locale}
			/>
		</div>
	)
}
