// app/api/faiths/wards/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { faiths, stakes, wards } from '@/db'
import { eq, asc } from 'drizzle-orm'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const faithId = searchParams.get('faithId')

	if (!faithId) {
		return NextResponse.json({ wards: [] })
	}

	// Join faith → stake → ward
	const rows = await db
		.select({
			stakeId: stakes.id,
			stakeName: stakes.name,
			wardId: wards.id,
			wardName: wards.name,
		})
		.from(wards)
		.innerJoin(stakes, eq(wards.stakeId, stakes.id))
		.innerJoin(faiths, eq(stakes.faithId, faiths.id))
		.where(eq(faiths.id, faithId))
		.orderBy(asc(stakes.name), asc(wards.name))

	// Group wards by stake
	const grouped = new Map<
		string,
		{
			stakeId: string
			stakeName: string
			wards: { id: string; name: string }[]
		}
	>()

	for (const row of rows) {
		if (!grouped.has(row.stakeId)) {
			grouped.set(row.stakeId, {
				stakeId: row.stakeId,
				stakeName: row.stakeName,
				wards: [],
			})
		}

		grouped.get(row.stakeId)!.wards.push({
			id: row.wardId,
			name: row.wardName,
		})
	}

	return NextResponse.json({
		wards: Array.from(grouped.values()),
	})
}
