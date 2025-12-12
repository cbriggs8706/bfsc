// app/api/kiosk/visit/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
	kioskVisitLogs,
	kioskShiftLogs,
	kioskPeople,
	kioskVisitPurposes,
} from '@/db/schema/tables/kiosk'
import { user } from '@/db/schema/tables/auth'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
)

export async function POST(req: Request) {
	const { personId, userId, purposeId, mailingListOptIn } =
		(await req.json()) as {
			personId: string
			userId?: string | null
			purposeId?: number | null
			mailingListOptIn?: boolean
		}

	// 1️⃣ Record the visit
	const [visit] = await db
		.insert(kioskVisitLogs)
		.values({
			personId,
			userId: userId ?? null,
			purposeId: purposeId ?? null,
			mailingListOptIn: !!mailingListOptIn,
		})
		.returning()

	// 2️⃣ Fetch patron name
	const [patron] = await db
		.select({ fullName: kioskPeople.fullName })
		.from(kioskPeople)
		.where(eq(kioskPeople.id, personId))

	// 3️⃣ Fetch purpose name (optional)
	let purposeName = 'General assistance'
	if (purposeId) {
		const [purpose] = await db
			.select({ name: kioskVisitPurposes.name })
			.from(kioskVisitPurposes)
			.where(eq(kioskVisitPurposes.id, purposeId))
		if (purpose?.name) purposeName = purpose.name
	}

	// 4️⃣ Find consultants currently on shift
	const now = new Date()

	const onShiftConsultants = await db
		.select({
			userId: kioskShiftLogs.userId,
		})
		.from(kioskShiftLogs)
		.where(
			and(
				gt(kioskShiftLogs.expectedDepartureAt, now),
				isNull(kioskShiftLogs.actualDepartureAt)
			)
		)

	// 5️⃣ Notify ONLY those consultants
	for (const consultant of onShiftConsultants) {
		await supabase.channel(`consultant-${consultant.userId}`).send({
			type: 'broadcast',
			event: 'new-patron',
			payload: {
				patronName: patron?.fullName ?? 'Unknown patron',
				purposeName,
				visitId: visit.id,
				createdAt: new Date().toISOString(),
			},
		})
	}

	return NextResponse.json({ visit })
}
