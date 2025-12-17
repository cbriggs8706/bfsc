// app/api/kiosk/library/search/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { ilike, or, eq } from 'drizzle-orm'
import { libraryCopies, libraryItems } from '@/db/schema/tables/library'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const q = searchParams.get('q')

	if (!q) {
		return NextResponse.json({ results: [] })
	}

	const rows = await db
		.select({
			copyId: libraryCopies.id,
			copyCode: libraryCopies.copyCode,
			status: libraryCopies.status,

			itemName: libraryItems.name,
			itemType: libraryItems.type,
			authorManufacturer: libraryItems.authorManufacturer,
		})
		.from(libraryCopies)
		.innerJoin(
			libraryItems,
			eq(libraryCopies.itemId, libraryItems.id) // ✅ CORRECT JOIN
		)
		.where(
			or(
				ilike(libraryItems.name, `%${q}%`),
				ilike(libraryItems.authorManufacturer, `%${q}%`),
				ilike(libraryCopies.copyCode, `%${q}%`),
				ilike(libraryItems.isbn, `%${q}%`) // if you have this column
			)
		)
		.orderBy(libraryItems.name)
		.limit(10)

	const results = rows.map((r) => ({
		copyId: r.copyId,
		copyCode: r.copyCode,
		status: r.status,
		item: {
			name: r.itemName,
			type: r.itemType,
			authorManufacturer: r.authorManufacturer ?? undefined,
		},
	}))

	return NextResponse.json({ results })
}
