// app/api/kiosk/purposes/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitPurposes } from '@/db/schema/tables/kiosk'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
	const purposes = await db
		.select()
		.from(kioskVisitPurposes)
		.where(eq(kioskVisitPurposes.isActive, true))
		.orderBy(asc(kioskVisitPurposes.sortOrder))

	return NextResponse.json({ purposes })
}
