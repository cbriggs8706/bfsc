import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskSpecialHours } from '@/db/schema/tables/kiosk'
import { asc } from 'drizzle-orm'

function dateRange(start: string, end: string): string[] {
	const result: string[] = []
	const cur = new Date(start)
	const endDate = new Date(end)

	while (cur <= endDate) {
		result.push(cur.toISOString().split('T')[0])
		cur.setDate(cur.getDate() + 1)
	}
	return result
}

export async function GET() {
	const rows = await db
		.select()
		.from(kioskSpecialHours)
		.orderBy(asc(kioskSpecialHours.date))

	return NextResponse.json({ hours: rows })
}

export async function POST(req: Request) {
	const { startDate, endDate, reason } = await req.json()

	if (!startDate) {
		return NextResponse.json({ error: 'startDate required' }, { status: 400 })
	}

	const dates = endDate ? dateRange(startDate, endDate) : [startDate]

	for (const d of dates) {
		await db.insert(kioskSpecialHours).values({
			date: d,
			isClosed: true,
			reason: reason ?? null,
		})
	}

	return NextResponse.json({ success: true, count: dates.length })
}
