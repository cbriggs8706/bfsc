import { HistoricalKioskEntriesForm } from '@/components/admin/kiosk/HistoricalKioskEntriesForm'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { requireRole } from '@/utils/require-role'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminHistoricalKioskPage({ params }: Props) {
	const { locale } = await params

	await requireRole(locale, ['Admin', 'Director'], `/${locale}/admin`)
	const centerTime = await getCenterTimeConfig()

	return (
		<div className="space-y-6 p-4">
			<div className="max-w-3xl space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">
					Add historical kiosk entries
				</h1>
				<p className="text-sm text-muted-foreground">
					Use this when you need to backfill missed patron sign-ins from a paper
					log or prior report. Enter one date for the batch, then add each
					time-and-name line below.
				</p>
			</div>

			<HistoricalKioskEntriesForm timeZone={centerTime.timeZone} />
		</div>
	)
}
