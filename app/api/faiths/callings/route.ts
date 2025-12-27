// app/api/faiths/callings/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { callings } from '@/db'

export async function GET() {
	const rows = await db
		.select({
			id: callings.id,
			name: callings.name,
		})
		.from(callings)
		.orderBy(callings.name)

	return NextResponse.json({ callings: rows })
}
