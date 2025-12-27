// app/[locale]/(workers)/substitute/availability/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailabilityData } from '@/db/queries/shifts'
import { AvailabilityDashboardClient } from '@/components/shifts/AvailabilityDashboardClient'
import { getTranslations } from 'next-intl/server'
interface Props {
	params: Promise<{ locale: string }>
}

export default async function AvailabilityPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'substitutes' })

	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	const data = await getAvailabilityData(session.user.id)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('availability.title')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('availability.define')}
				</p>
			</div>
			<AvailabilityDashboardClient {...data} />
		</div>
	)
}
