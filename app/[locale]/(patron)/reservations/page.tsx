// app/[locale]/(patron)/reservations/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { getActiveResources } from '@/db/queries/resources/resources'
import { ReservationForm } from '@/components/resource/ReservationForm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function ReservationsPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	// 1️⃣ Auth guard
	const user = await getCurrentUser()
	if (!user) {
		redirect(`/${locale}/login?redirect=/${locale}/reservations`)
	}

	// 3️⃣ Load resources
	const resources = await getActiveResources()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('reservation.title')}</h1>
				<p className="text-sm text-muted-foreground">{t('reservation.sub')}</p>
			</div>

			<ReservationForm resources={resources} />

			<section className="rounded-lg border p-4 text-sm text-muted-foreground">
				<p>
					Need help choosing equipment or preparing materials? A consultant will
					be happy to assist you.
				</p>
			</section>
		</div>
	)
}
