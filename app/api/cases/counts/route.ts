// app/api/cases/counts/route.ts
import { NextResponse } from 'next/server'
import { db, cases, caseWatchers, caseInvestigators } from '@/db'
import { and, eq, gt, sql } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type CaseCounts = {
	open: number
	investigating: number
	myInvestigating: number
	waiting: number
	solved: number
	archived: number
	watching: number
}

export async function GET() {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - 13)

	// These are each simple counts; readable + safe.
	const [
		openRows,
		waitingRows,
		archivedRows,
		solvedRows,
		watchingRows,
		investigatingRows,
		myInvestigatingRows,
	] = await Promise.all([
		db
			.select({ n: sql<number>`count(*)` })
			.from(cases)
			.where(eq(cases.status, 'open')),
		db
			.select({ n: sql<number>`count(*)` })
			.from(cases)
			.where(eq(cases.status, 'waiting')),
		db
			.select({ n: sql<number>`count(*)` })
			.from(cases)
			.where(eq(cases.status, 'archived')),
		db
			.select({ n: sql<number>`count(*)` })
			.from(cases)
			.where(and(eq(cases.status, 'solved'), gt(cases.solvedAt, cutoff))),
		db
			.select({ n: sql<number>`count(distinct ${cases.id})` })
			.from(cases)
			.innerJoin(caseWatchers, eq(caseWatchers.caseId, cases.id))
			.where(eq(caseWatchers.userId, user.id)),
		db
			.select({ n: sql<number>`count(*)` })
			.from(cases)
			.where(eq(cases.status, 'investigating')),
		db
			.select({ n: sql<number>`count(*)` })
			.from(caseInvestigators)
			.innerJoin(cases, eq(cases.id, caseInvestigators.caseId))
			.where(
				and(
					eq(caseInvestigators.userId, user.id),
					eq(cases.status, 'investigating')
				)
			),
	])

	const counts: CaseCounts = {
		open: openRows[0]?.n ?? 0,
		investigating: investigatingRows[0]?.n ?? 0,
		myInvestigating: myInvestigatingRows[0]?.n ?? 0,
		waiting: waitingRows[0]?.n ?? 0,
		solved: solvedRows[0]?.n ?? 0,
		archived: archivedRows[0]?.n ?? 0,
		watching: watchingRows[0]?.n ?? 0,
	}

	return NextResponse.json(counts)
}
