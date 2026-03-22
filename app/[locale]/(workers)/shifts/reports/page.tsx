// app/[locale]/(workers)/shifts/reports/page.tsx

import { headers } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { ShiftReport } from '@/components/reports/ShiftReport'
import { getTranslations } from 'next-intl/server'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { authOptions } from '@/lib/auth'
import { getFaithTree } from '@/db/queries/faiths'
interface Props {
	params: Promise<{ locale: string }>
}

export default async function ShiftReportPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'Patron'
	const canEditVisitFaithGroup = [
		'Admin',
		'Director',
		'Assistant Director',
		'Shift Lead',
		'Worker',
	].includes(role)

	const headersList = await headers()

	const host = headersList.get('host')
	const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

	if (!host) {
		throw new Error('Missing host header')
	}

	const res = await fetch(`${protocol}://${host}/api/reports/shifts/today`, {
		cache: 'no-store',
	})

	if (!res.ok) {
		throw new Error('Failed to load today shifts')
	}

	const data = await res.json()
	const centerTime = await getCenterTimeConfig()
	const faithTree = canEditVisitFaithGroup ? await getFaithTree() : []

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('shifts.reports')}</h1>
				<p className="text-sm text-muted-foreground">{t('shifts.dailyHist')}</p>
			</div>
			<ShiftReport
				initialShifts={data.shifts}
				centerTime={centerTime}
				initialOffShift={data.offShift}
				canEditVisitFaithGroup={canEditVisitFaithGroup}
				faithTree={faithTree}
			/>
		</div>
	)
}
