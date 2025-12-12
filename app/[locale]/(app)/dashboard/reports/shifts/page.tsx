// app/[locale]/(app)/dashboard/reports/shifts/page.tsx

import { headers } from 'next/headers'
import { ShiftReport } from '@/components/reports/ShiftReport'

export default async function ShiftReportPage() {
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

	return (
		<ShiftReport initialShifts={data.shifts} initialOffShift={data.offShift} />
	)
}
