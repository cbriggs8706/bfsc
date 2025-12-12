// app/api/reports/shifts/summary/route.ts
import { db } from '@/db'
import { resolveDateRange } from '@/lib/date-ranges'
import type { DateRangePreset } from '@/types/shift-report'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

type CountRow = {
	label: string
	count: number
}

function toPgLocalTimestamp(d: Date) {
	// local timestamp string without timezone: YYYY-MM-DD HH:mm:ss.SSS
	const pad = (n: number, w = 2) => String(n).padStart(w, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
		d.getHours()
	)}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
		d.getMilliseconds(),
		3
	)}`
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const preset = searchParams.get('preset') as DateRangePreset | null

	if (!preset) {
		return NextResponse.json({ error: 'Missing preset' }, { status: 400 })
	}

	const { start, end } = resolveDateRange(preset)

	// IMPORTANT: compare + label using Boise calendar days
	const tz = 'America/Boise'
	const isYearRange = preset === 'ytd' || preset === 'lastYear'
	const groupFormat = isYearRange ? 'YYYY-MM' : 'YYYY-MM-DD'

	const startLocal = toPgLocalTimestamp(start)
	const endLocal = toPgLocalTimestamp(end)

	const consultantsResult = await db.execute<CountRow>(sql`
		select
			to_char((arrival_at at time zone ${tz}), ${groupFormat}) as label,
			count(*)::int as count
		from kiosk_shift_logs
		where (arrival_at at time zone ${tz})
			between ${startLocal}::timestamp and ${endLocal}::timestamp
		group by 1
		order by 1
	`)

	const patronsResult = await db.execute<CountRow>(sql`
		select
			to_char((created_at at time zone ${tz}), ${groupFormat}) as label,
			count(*)::int as count
		from kiosk_visit_logs
		where (created_at at time zone ${tz})
			between ${startLocal}::timestamp and ${endLocal}::timestamp
		group by 1
		order by 1
	`)

	const map = new Map<string, { consultants: number; patrons: number }>()

	for (const row of consultantsResult) {
		map.set(row.label, { consultants: row.count, patrons: 0 })
	}

	for (const row of patronsResult) {
		const existing = map.get(row.label)
		if (existing) existing.patrons = row.count
		else map.set(row.label, { consultants: 0, patrons: row.count })
	}

	const summary = Array.from(map.entries()).map(([label, values]) => ({
		label,
		...values,
	}))

	return NextResponse.json({
		summary,
		range: { start: startLocal, end: endLocal, tz },
	})
}
