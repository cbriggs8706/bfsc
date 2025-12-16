// app/api/faiths/stakes/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { stakes } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const faithId = searchParams.get('faithId')

	if (!faithId) {
		return NextResponse.json({ stakes: [] })
	}

	const rows = await db
		.select({
			id: stakes.id,
			name: stakes.name,
		})
		.from(stakes)
		.where(eq(stakes.faithId, faithId))
		.orderBy(stakes.name)

	return NextResponse.json({ stakes: rows })
}
