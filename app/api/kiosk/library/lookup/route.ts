// app/api/kiosk/library/lookup/route.ts
import { NextResponse } from 'next/server'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import {
	libraryCopies,
	libraryItems,
	libraryLoans,
} from '@/db/schema/tables/library'
import { user } from '@/db/schema/tables/auth'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const code = searchParams.get('code')

	if (!code) {
		return NextResponse.json({ error: 'Missing copy code' }, { status: 400 })
	}

	// 1. Find the copy + item
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
		.innerJoin(libraryItems, eq(libraryCopies.itemId, libraryItems.id))
		.where(eq(libraryCopies.copyCode, code))
		.limit(1)

	if (rows.length === 0) {
		return NextResponse.json({ error: 'Copy not found' }, { status: 404 })
	}

	const copy = rows[0]

	// 2. If checked out, find active loan
	let checkedOutTo: { name: string } | undefined

	if (copy.status === 'checked_out') {
		const loanRows = await db
			.select({
				borrowerName: libraryLoans.borrowerName,
				userName: user.name,
			})
			.from(libraryLoans)
			.leftJoin(user, eq(libraryLoans.borrowerUserId, user.id))
			.where(
				and(
					eq(libraryLoans.copyId, copy.copyId),
					isNull(libraryLoans.returnedAt)
				)
			)
			.limit(1)

		if (loanRows.length > 0) {
			const loan = loanRows[0]
			checkedOutTo = {
				name: loan.userName ?? loan.borrowerName ?? 'Unknown',
			}
		}
	}

	// 3. Return kiosk-friendly shape
	return NextResponse.json({
		copyId: copy.copyId,
		copyCode: copy.copyCode,
		status: copy.status,
		item: {
			name: copy.itemName,
			type: copy.itemType,
			authorManufacturer: copy.authorManufacturer ?? undefined,
		},
		...(checkedOutTo ? { checkedOutTo } : {}),
	})
}
