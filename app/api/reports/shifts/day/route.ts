// app/api/reports/shifts/day/route.ts
import { NextResponse } from 'next/server'
import { getShiftReportDay } from '@/db/queries/shifts/shift-report-day'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const date = searchParams.get('date')

	if (!date) {
		return NextResponse.json({ error: 'Missing date' }, { status: 400 })
	}

	const data = await getShiftReportDay(date)
	return NextResponse.json(data)
}
