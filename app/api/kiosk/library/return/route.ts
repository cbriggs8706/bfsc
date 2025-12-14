// app/api/kiosk/library/return/route.ts
import { NextResponse } from 'next/server'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { libraryCopies, libraryLoans } from '@/db/schema/tables/library'

export async function POST(req: Request) {
	const body = await req.json()

	const { copyId } = body as { copyId?: string }

	if (!copyId) {
		return NextResponse.json({ error: 'Missing copyId' }, { status: 400 })
	}

	try {
		await db.transaction(async (tx) => {
			// 1. Verify copy is checked out
			const copies = await tx
				.select({
					status: libraryCopies.status,
				})
				.from(libraryCopies)
				.where(eq(libraryCopies.id, copyId))
				.limit(1)

			if (copies.length === 0) {
				throw new Error('COPY_NOT_FOUND')
			}

			if (copies[0].status !== 'checked_out') {
				throw new Error('NOT_CHECKED_OUT')
			}

			// 2. Find active loan
			const loans = await tx
				.select({
					id: libraryLoans.id,
				})
				.from(libraryLoans)
				.where(
					and(eq(libraryLoans.copyId, copyId), isNull(libraryLoans.returnedAt))
				)
				.limit(1)

			if (loans.length === 0) {
				throw new Error('NO_ACTIVE_LOAN')
			}

			// 3. Close loan
			await tx
				.update(libraryLoans)
				.set({ returnedAt: new Date() })
				.where(eq(libraryLoans.id, loans[0].id))

			// 4. Update copy status
			await tx
				.update(libraryCopies)
				.set({ status: 'available' })
				.where(eq(libraryCopies.id, copyId))
		})

		return NextResponse.json({ success: true })
	} catch (err: any) {
		if (err.message === 'COPY_NOT_FOUND') {
			return NextResponse.json({ error: 'Copy not found' }, { status: 404 })
		}

		if (err.message === 'NOT_CHECKED_OUT') {
			return NextResponse.json(
				{ error: 'Item is not checked out' },
				{ status: 409 }
			)
		}

		console.error(err)
		return NextResponse.json({ error: 'Return failed' }, { status: 500 })
	}
}
