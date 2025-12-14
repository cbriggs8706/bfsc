// app/api/kiosk/library/checkout/route.ts
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { libraryCopies, libraryLoans } from '@/db/schema/tables/library'

export async function POST(req: Request) {
	const body = await req.json()

	const { copyId, borrowerUserId, borrowerName, borrowerEmail, borrowerPhone } =
		body as {
			copyId?: string
			borrowerUserId?: string
			borrowerName?: string
			borrowerEmail?: string
			borrowerPhone?: string
		}

	if (!copyId) {
		return NextResponse.json({ error: 'Missing copyId' }, { status: 400 })
	}

	if (!borrowerUserId && !borrowerName) {
		return NextResponse.json({ error: 'Borrower required' }, { status: 400 })
	}

	try {
		await db.transaction(async (tx) => {
			// 1. Lock + verify copy
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

			if (copies[0].status !== 'available') {
				throw new Error('NOT_AVAILABLE')
			}

			// 2. Create loan
			await tx.insert(libraryLoans).values({
				copyId,
				borrowerUserId: borrowerUserId ?? null,
				borrowerName: borrowerName ?? null,
				borrowerEmail: borrowerEmail ?? null,
				borrowerPhone: borrowerPhone ?? null,
			})

			// 3. Update copy status
			await tx
				.update(libraryCopies)
				.set({ status: 'checked_out' })
				.where(eq(libraryCopies.id, copyId))
		})

		return NextResponse.json({ success: true })
	} catch (err: any) {
		if (err.message === 'COPY_NOT_FOUND') {
			return NextResponse.json({ error: 'Copy not found' }, { status: 404 })
		}

		if (err.message === 'NOT_AVAILABLE') {
			return NextResponse.json(
				{ error: 'Item is already checked out' },
				{ status: 409 }
			)
		}

		console.error(err)
		return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
	}
}
