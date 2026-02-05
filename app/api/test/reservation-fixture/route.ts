// app/api/test/reservation-fixture/route.ts
import { NextResponse } from 'next/server'
import { addDays, format } from 'date-fns'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { eq, or } from 'drizzle-orm'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getAvailability } from '@/lib/actions/resource/availability'

const LOOKAHEAD_DAYS = 30

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
	const resourceId = searchParams.get('resourceId')
	const userId = searchParams.get('userId')
	const userLookup = searchParams.get('userLookup')

	const { items } = await readAllResources({ pageSize: 50 })
	const resource =
		items.find((r) => r.id === resourceId) ??
		items.find((r) => r.isActive) ??
		items[0]

	if (!resource) {
		return NextResponse.json(
			{ error: 'No resources available for fixtures.' },
			{ status: 404 }
		)
	}

	let submitterEmail: string | null = null
	if (userId || userLookup) {
		const row = await db.query.user.findFirst({
			where: userId
				? eq(user.id, userId)
				: or(eq(user.email, userLookup ?? ''), eq(user.username, userLookup ?? '')),
			columns: { email: true },
		})
		submitterEmail = row?.email ?? null
	}

	for (let i = 0; i < LOOKAHEAD_DAYS; i += 1) {
		const date = format(addDays(new Date(), i), 'yyyy-MM-dd')
		const availability = await getAvailability({
			resourceId: resource.id,
			date,
		})

		const slot = availability.timeSlots[0]
		if (slot) {
			return NextResponse.json({
				resourceId: resource.id,
				resourceName: resource.name,
				date,
				startTime: slot.startTime,
				weeklyShiftId: slot.weeklyShiftId,
				submitterEmail,
			})
		}
	}

	return NextResponse.json(
		{ error: `No availability found in next ${LOOKAHEAD_DAYS} days.` },
		{ status: 404 }
	)
}
