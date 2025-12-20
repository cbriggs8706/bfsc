// app/[locale]/(consultants)/substitute/availability/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailabilityData } from '@/db/queries/shifts'
import { AvailabilityDashboardClient } from '@/components/shifts/AvailabilityDashboardClient'

export default async function AvailabilityPage() {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null

	const data = await getAvailabilityData(session.user.id)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Availability</h1>
				<p className="text-sm text-muted-foreground">
					Define your availability for substitutions.{' '}
				</p>
			</div>
			<AvailabilityDashboardClient {...data} />
		</div>
	)
}
