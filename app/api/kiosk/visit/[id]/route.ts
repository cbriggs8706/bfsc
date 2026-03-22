import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskVisitLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { serializeVisitMeta } from '@/lib/kiosk/visit-meta'

const VISIT_EDIT_ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Shift Lead',
	'Worker',
] as const

function canEditVisit(role: string | null | undefined) {
	return (
		role !== null &&
		role !== undefined &&
		VISIT_EDIT_ROLES.includes(role as (typeof VISIT_EDIT_ROLES)[number])
	)
}

type PatchBody = {
	visitMeta?: {
		visitReason?: 'patron' | 'training' | 'group'
		partOfFaithGroup?: boolean | null
		faithGroupName?: string | null
		stakeName?: string | null
		wardName?: string | null
		peopleCameWithVisitor?: number | null
	} | null
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params

	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!canEditVisit(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const deleted = await db
		.delete(kioskVisitLogs)
		.where(eq(kioskVisitLogs.id, id))
		.returning({ id: kioskVisitLogs.id })

	if (deleted.length === 0) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ ok: true })
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params

	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!canEditVisit(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const body = (await req.json()) as PatchBody
	const notes = serializeVisitMeta(body.visitMeta)

	const updated = await db
		.update(kioskVisitLogs)
		.set({ notes })
		.where(eq(kioskVisitLogs.id, id))
		.returning({ id: kioskVisitLogs.id, notes: kioskVisitLogs.notes })

	if (updated.length === 0) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ ok: true, visit: updated[0] })
}
