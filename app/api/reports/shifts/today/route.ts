// app/api/reports/shifts/today/route.ts
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { getShiftReportDay } from '@/db/queries/shifts/shift-report-day'

export async function GET() {
	const todayStr = format(new Date(), 'yyyy-MM-dd')
	const data = await getShiftReportDay(todayStr)
	return NextResponse.json(data)
}
