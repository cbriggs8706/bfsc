// app/api/reports/shifts/today/route.ts
import { NextResponse } from 'next/server'
import { getShiftReportDay } from '@/db/queries/shifts/shift-report-day'
import { ymdInTz } from '@/utils/time'
import { getCenterTimeConfig } from '@/lib/time/center-time'

export async function GET() {
	const centerTime = await getCenterTimeConfig()

	const todayStr = ymdInTz(new Date(), centerTime.timeZone)
	const data = await getShiftReportDay(todayStr, centerTime.timeZone)
	return NextResponse.json(data)
}
