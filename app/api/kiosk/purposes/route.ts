import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitPurposes } from '@/db/schema/tables/kiosk'
import { asc } from 'drizzle-orm'

// ────────────────────────────────
// GET — list purposes (admin view)
// ────────────────────────────────
export async function GET() {
	const items = await db
		.select()
		.from(kioskVisitPurposes)
		.orderBy(asc(kioskVisitPurposes.sortOrder))

	return NextResponse.json({ purposes: items })
}

// ────────────────────────────────
// POST — create a new purpose
// ────────────────────────────────
export async function POST(req: Request) {
	const { name, sortOrder = 0, isActive = true } = await req.json()

	if (!name || name.trim() === '') {
		return NextResponse.json({ error: 'Name is required' }, { status: 400 })
	}

	const [created] = await db
		.insert(kioskVisitPurposes)
		.values({
			name,
			sortOrder,
			isActive,
		})
		.returning()

	return NextResponse.json({ purpose: created })
}
