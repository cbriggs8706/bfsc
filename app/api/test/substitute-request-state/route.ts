import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { shiftSubRequests } from '@/db/schema/tables/substitutes'
import { notifications } from '@/db/schema/tables/notifications'

function isAllowed(req: Request) {
	if (process.env.NODE_ENV === 'production') return false

	const secret = process.env.E2E_OUTBOX_SECRET
	if (!secret) return true

	return req.headers.get('x-e2e-secret') === secret
}

export async function GET(req: Request) {
	if (!isAllowed(req)) {
		return new NextResponse('Not found', { status: 404 })
	}

	const { searchParams } = new URL(req.url)
	const requestId = searchParams.get('requestId')
	const userId = searchParams.get('userId')

	if (!requestId) {
		return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
	}

	const requestRow = await db.query.shiftSubRequests.findFirst({
		where: eq(shiftSubRequests.id, requestId),
		columns: {
			id: true,
			status: true,
			nominatedSubUserId: true,
			acceptedByUserId: true,
			updatedAt: true,
		},
	})

	if (!requestRow) {
		return NextResponse.json({ error: 'Request not found' }, { status: 404 })
	}

	let userNotificationCount = 0
	if (userId) {
		const rows = await db
			.select({ id: notifications.id })
			.from(notifications)
			.where(eq(notifications.userId, userId))
		userNotificationCount = rows.length
	}

	return NextResponse.json({
		request: requestRow,
		userNotificationCount,
	})
}
