// app/api/kiosk/visit/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
	kioskVisitLogs,
	kioskShiftLogs,
	kioskPeople,
	kioskVisitPurposes,
} from '@/db/schema/tables/kiosk'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
)

export async function POST(req: Request) {
	const { personId, userId, purposeId, mailingListOptIn, visitMeta } =
		(await req.json()) as {
			personId: string
			userId?: string | null
			purposeId?: number | null
			mailingListOptIn?: boolean
			visitMeta?: {
				visitReason?: 'patron' | 'training' | 'group'
				partOfFaithGroup?: boolean | null
				faithGroupName?: string | null
				stakeName?: string | null
				wardName?: string | null
				peopleCameWithVisitor?: number | null
			}
		}

	const normalizedPeopleCameWithVisitor = Math.max(
		0,
		Math.floor(visitMeta?.peopleCameWithVisitor ?? 0)
	)

	const notes =
		visitMeta && visitMeta.visitReason !== 'patron'
			? JSON.stringify({
					visitReason: visitMeta.visitReason,
					partOfFaithGroup: visitMeta.partOfFaithGroup ?? null,
					faithGroupName: visitMeta.faithGroupName ?? null,
					stakeName: visitMeta.stakeName ?? null,
					wardName: visitMeta.wardName ?? null,
					peopleCameWithVisitor: normalizedPeopleCameWithVisitor,
				})
			: null

	// 1️⃣ Record the visit
	const [visit] = await db
		.insert(kioskVisitLogs)
		.values({
			personId,
			userId: userId ?? null,
			purposeId: purposeId ?? null,
			mailingListOptIn: !!mailingListOptIn,
			notes,
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

	// 4️⃣ Find workers currently on shift
	const now = new Date()

	const onShiftWorkers = await db
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

	// 5️⃣ Notify ONLY those workers
	for (const worker of onShiftWorkers) {
		await supabase.channel(`worker-${worker.userId}`).send({
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
