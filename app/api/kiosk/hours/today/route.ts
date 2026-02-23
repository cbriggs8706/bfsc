import { NextResponse } from 'next/server'
import { db } from '@/db'
import { operatingHours, specialHours } from '@/db'
import { eq } from 'drizzle-orm'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { ymdInTz } from '@/utils/time'

export async function GET() {
	const centerTime = await getCenterTimeConfig()
	const now = new Date()
	const todayDateString = ymdInTz(now, centerTime.timeZone)
	const weekdayShort = new Intl.DateTimeFormat('en-US', {
		timeZone: centerTime.timeZone,
		weekday: 'short',
	}).format(now)
	const weekdayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	}
	const weekday = weekdayMap[weekdayShort] ?? 0

	// ───────────────────────────────────────────
	// 1. SPECIAL HOURS OVERRIDE CHECK
	// ───────────────────────────────────────────
	const special = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.date, todayDateString))
		.limit(1)

	if (special.length > 0) {
		const s = special[0]

		return NextResponse.json({
			isClosed: s.isClosed,
			opensAt: s.opensAt ?? null,
			closesAt: s.closesAt ?? null,
			source: 'special',
		})
	}

	// ───────────────────────────────────────────
	// 2. FALL BACK TO WEEKLY OPERATING HOURS
	// ───────────────────────────────────────────
	const weekly = await db
		.select()
		.from(operatingHours)
		.where(eq(operatingHours.weekday, weekday))
		.limit(1)

	if (weekly.length === 0) {
		// Should never happen once seeded, but safe fallback
		return NextResponse.json({
			isClosed: true,
			opensAt: null,
			closesAt: null,
			source: 'weekly-missing',
		})
	}

	const hours = weekly[0]

	return NextResponse.json({
		isClosed: hours.isClosed,
		opensAt: hours.opensAt,
		closesAt: hours.closesAt,
		source: 'weekly',
	})
}
