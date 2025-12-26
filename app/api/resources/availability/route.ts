// app/api/resources/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAvailabilityForDate } from '@/lib/reservations/get-availability-for-date'

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)

	const resourceId = searchParams.get('resourceId')
	const date = searchParams.get('date')

	if (!resourceId || !date) {
		return NextResponse.json(
			{ error: 'Missing resourceId or date' },
			{ status: 400 }
		)
	}

	const result = await getAvailabilityForDate({
		resourceId,
		date,
	})

	return NextResponse.json(result)
}
