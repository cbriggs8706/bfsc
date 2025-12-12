// app/api/kiosk/on-shift/route.ts
import { db } from '@/db/client'
import { kioskShiftLogs, kioskPeople } from '@/db/schema/tables/kiosk'
import { gt, eq } from 'drizzle-orm'

export async function GET() {
	const now = new Date() // UTC-safe

	const consultants = await db
		.select({
			personId: kioskShiftLogs.personId,
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(gt(kioskShiftLogs.expectedDepartureAt, now))
	console.log('ON SHIFT ROUTE HIT')

	return Response.json({ consultants })
}
