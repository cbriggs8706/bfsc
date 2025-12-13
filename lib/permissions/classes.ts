// lib/permissions/classes.ts
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	classSeries,
	classSeriesPresenter,
	classSession,
	classSessionPresenter,
} from '@/db/schema/tables/classes'

export async function canCreateClass(userId: string) {
	const u = await db.query.user.findFirst({
		where: eq(user.id, userId),
		columns: { role: true },
	})
	return Boolean(u && u.role !== 'Patron')
}

export async function canManageSeries(params: {
	userId: string
	seriesId: string
}) {
	const u = await db.query.user.findFirst({
		where: eq(user.id, params.userId),
		columns: { role: true },
	})
	if (!u) return false
	if (u.role === 'Patron') return false
	if (u.role === 'Admin') return true

	const s = await db.query.classSeries.findFirst({
		where: eq(classSeries.id, params.seriesId),
		columns: { createdByUserId: true },
	})
	if (!s) return false
	if (s.createdByUserId === params.userId) return true

	// presenter on the series?
	const p = await db.query.classSeriesPresenter.findFirst({
		where: and(
			eq(classSeriesPresenter.seriesId, params.seriesId),
			eq(classSeriesPresenter.userId, params.userId)
		),
	})
	return Boolean(p)
}

export async function canManageSession(params: {
	userId: string
	sessionId: string
}) {
	const u = await db.query.user.findFirst({
		where: eq(user.id, params.userId),
		columns: { role: true },
	})
	if (!u) return false
	if (u.role === 'Patron') return false
	if (u.role === 'Admin') return true

	const sess = await db.query.classSession.findFirst({
		where: eq(classSession.id, params.sessionId),
		columns: { seriesId: true },
	})
	if (!sess) return false

	// presenter on the session?
	const sp = await db.query.classSessionPresenter.findFirst({
		where: and(
			eq(classSessionPresenter.sessionId, params.sessionId),
			eq(classSessionPresenter.userId, params.userId)
		),
	})
	if (sp) return true

	// otherwise fallback to series permission (creator/presenter)
	return canManageSeries({ userId: params.userId, seriesId: sess.seriesId })
}
