// app/api/faiths/route.ts

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { faiths } from '@/db'

export async function GET() {
	const rows = await db
		.select({
			id: faiths.id,
			name: faiths.name,
		})
		.from(faiths)
		.orderBy(faiths.name)

	return NextResponse.json({ faiths: rows })
}
