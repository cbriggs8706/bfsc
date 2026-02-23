import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialHours } from '@/db'
import { asc } from 'drizzle-orm'
import { parseLocalYMD, toYYYYMMDD } from '@/utils/time'

function dateRange(start: string, end: string): string[] {
	const result: string[] = []
	const cur = parseLocalYMD(start)
	const endDate = parseLocalYMD(end)

	while (cur <= endDate) {
		result.push(toYYYYMMDD(cur))
		cur.setDate(cur.getDate() + 1)
	}
	return result
}

export async function GET() {
	const rows = await db
		.select()
		.from(specialHours)
		.orderBy(asc(specialHours.date))

	return NextResponse.json({ hours: rows })
}

export async function POST(req: Request) {
	const { startDate, endDate, reason } = await req.json()

	if (!startDate) {
		return NextResponse.json({ error: 'startDate required' }, { status: 400 })
	}

	const dates = endDate ? dateRange(startDate, endDate) : [startDate]

	for (const d of dates) {
		await db.insert(specialHours).values({
			date: d,
			isClosed: true,
			reason: reason ?? null,
		})
	}

	return NextResponse.json({ success: true, count: dates.length })
}
