// app/api/faiths/positions/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { positions } from '@/db'

export async function GET() {
	const rows = await db
		.select({
			id: positions.id,
			name: positions.name,
		})
		.from(positions)
		.orderBy(positions.name)

	return NextResponse.json({ positions: rows })
}
