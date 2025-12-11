import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskOperatingHours } from '@/db/schema/tables/kiosk'
import { asc } from 'drizzle-orm'

export async function GET() {
	const hours = await db
		.select()
		.from(kioskOperatingHours)
		.orderBy(asc(kioskOperatingHours.weekday))

	return NextResponse.json({ hours })
}
