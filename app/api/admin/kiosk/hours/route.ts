import { NextResponse } from 'next/server'
import { db } from '@/db'
import { operatingHours } from '@/db'
import { asc } from 'drizzle-orm'

export async function GET() {
	const hours = await db
		.select()
		.from(operatingHours)
		.orderBy(asc(operatingHours.weekday))

	return NextResponse.json({ hours })
}
