// app/[locale]/(consultants)/reports/shifts/page.tsx

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
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Shift Reports</h1>
				<p className="text-sm text-muted-foreground">Daily and Historical</p>
			</div>
			<ShiftReport
				initialShifts={data.shifts}
				initialOffShift={data.offShift}
			/>
		</div>
	)
}
