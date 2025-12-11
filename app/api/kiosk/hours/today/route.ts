import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
	kioskOperatingHours,
	kioskSpecialHours,
} from '@/db/schema/tables/kiosk'
import { eq } from 'drizzle-orm'

export async function GET() {
	// Current date info
	const today = new Date()
	const weekday = today.getDay() // 0 = Sunday, 1 = Monday ...
	const todayDateString = today.toISOString().split('T')[0] // "YYYY-MM-DD"

	// ───────────────────────────────────────────
	// 1. SPECIAL HOURS OVERRIDE CHECK
	// ───────────────────────────────────────────
	const special = await db
		.select()
		.from(kioskSpecialHours)
		.where(eq(kioskSpecialHours.date, todayDateString))
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
		.from(kioskOperatingHours)
		.where(eq(kioskOperatingHours.weekday, weekday))
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
