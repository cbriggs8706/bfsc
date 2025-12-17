// app/api/announcements/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { announcement } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
	const rows = await db
		.select({
			id: announcement.id,
			title: announcement.title,
			body: announcement.body,
			createdAt: announcement.createdAt,
			expiresAt: announcement.expiresAt,
		})
		.from(announcement)
		.where(
			sql`${announcement.roles} @> ${JSON.stringify(['Patron'])}
			AND (
				${announcement.expiresAt} IS NULL
				OR ${announcement.expiresAt} > NOW()
			)`
		)
		.orderBy(announcement.createdAt)

	return NextResponse.json({ announcements: rows })
}
