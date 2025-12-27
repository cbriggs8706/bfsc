// db/queries/kiosk-workers.ts
import { db } from '@/db'
import { kioskPeople, kioskShiftLogs } from '@/db/schema/tables/kiosk'
import { eq, gt } from 'drizzle-orm'

export type OnShiftWorker = {
	personId: string
	fullName: string
	profileImageUrl: string | null
	expectedDepartureAt: Date
}

export async function getWorkersOnShift(): Promise<OnShiftWorker[]> {
	const now = new Date()

	const rows = await db
		.select({
			personId: kioskPeople.id,
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
			expectedDepartureAt: kioskShiftLogs.expectedDepartureAt,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(gt(kioskShiftLogs.expectedDepartureAt, now))

	return rows
}
