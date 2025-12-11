// app/api/kiosk/visit/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitLogs } from '@/db/schema/tables/kiosk'

export async function POST(req: Request) {
	const { personId, userId, purposeId, mailingListOptIn } =
		(await req.json()) as {
			personId: string
			userId?: string | null
			purposeId?: number | null
			mailingListOptIn?: boolean
		}

	const [visit] = await db
		.insert(kioskVisitLogs)
		.values({
			personId,
			userId: userId ?? null,
			purposeId: purposeId ?? null,
			mailingListOptIn: !!mailingListOptIn,
		})
		.returning()

	return NextResponse.json({ visit })
}
