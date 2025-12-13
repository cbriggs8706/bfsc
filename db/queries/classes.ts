// db/queries/classes.ts
import 'server-only'
import { db } from '@/db'
import { and, asc, desc, eq, inArray, min } from 'drizzle-orm'
import { user } from '@/db/schema/tables/auth'
import {
	classSeries,
	classSeriesPresenter,
	classSeriesLink,
	classSession,
	classSessionPresenter,
	classSessionLink,
	classSessionHandout,
} from '@/db/schema/tables/classes'

export type ClassSeriesRow = typeof classSeries.$inferSelect
export type ClassSessionRow = typeof classSession.$inferSelect

export type PresenterOption = { id: string; name: string | null; email: string }

export type UILink = { id: string; label: string; url: string }
export type UIHandout = {
	id: string
	fileName: string
	publicUrl: string | null
	filePath: string
}

export type UISession = ClassSessionRow & {
	presenterIds: string[] // if empty => inherit series presenters
	links: UILink[] // if empty => inherit series links
	handouts: UIHandout[]
}

export type UISeries = ClassSeriesRow & {
	presenterIds: string[]
	links: UILink[]
}

export type UISeriesWithSessions = {
	series: UISeries
	sessions: UISession[]
}

export type SeriesUpsertInput = {
	// series fields
	title: string
	description: string | null
	location: string
	zoomUrl: string | null
	recordingUrl: string | null
	coverImageUrl: string | null
	coverImagePath: string | null

	// draft/published control (admin can set)
	status?: 'draft' | 'published'

	presenterIds: string[]
	links: Array<{ label: string; url: string }>

	// sessions
	sessions: Array<{
		id?: string // present in update
		partNumber: number
		startsAt: string // ISO string (UTC)
		durationMinutes: number
		status: 'scheduled' | 'canceled'
		canceledReason: string | null

		// overrides (null => inherit)
		titleOverride: string | null
		descriptionOverride: string | null
		locationOverride: string | null
		zoomUrlOverride: string | null
		recordingUrlOverride: string | null

		// optional overrides
		presenterIds: string[] // if empty => inherit
		links: Array<{ label: string; url: string }> // if empty => inherit
		handouts: Array<{
			id?: string
			fileName: string
			filePath: string
			publicUrl: string | null
		}>
	}>

	// when updating, we need to know which session/links/handouts were removed
	deletedSessionIds?: string[]
	deletedSeriesLinkIds?: string[]
	deletedSessionLinkIds?: string[]
	deletedHandoutIds?: string[]
}

export type UISeriesTableRow = {
	id: string
	title: string
	status: 'draft' | 'published'
	startsAt: Date | null
	presenters: string[]
	createdByUserId: string
}

// -----------------------
// HELPERS: permissions
// -----------------------
async function getUserRole(userId: string) {
	const u = await db.query.user.findFirst({
		where: eq(user.id, userId),
		columns: { role: true },
	})
	return u?.role ?? null
}

export async function canCreateClass(currentUserId: string) {
	const role = await getUserRole(currentUserId)
	return Boolean(role && role !== 'Patron')
}

export async function canManageSeries(currentUserId: string, seriesId: string) {
	const role = await getUserRole(currentUserId)
	if (!role || role === 'Patron') return false
	if (role === 'Admin') return true

	const s = await db.query.classSeries.findFirst({
		where: eq(classSeries.id, seriesId),
		columns: { createdByUserId: true },
	})
	if (!s) return false
	if (s.createdByUserId === currentUserId) return true

	const p = await db.query.classSeriesPresenter.findFirst({
		where: and(
			eq(classSeriesPresenter.seriesId, seriesId),
			eq(classSeriesPresenter.userId, currentUserId)
		),
	})
	return Boolean(p)
}

export async function listPresenterOptions(): Promise<PresenterOption[]> {
	// You can filter out patrons if you want; I’m leaving everyone selectable.
	const rows = await db.query.user.findMany({
		columns: { id: true, name: true, email: true },
		orderBy: (t, { asc }) => asc(t.name),
	})
	return rows
}

// -----------------------
// READ
// -----------------------
export async function getSeriesWithSessionsById(
	seriesId: string
): Promise<UISeriesWithSessions | null> {
	const s = await db.query.classSeries.findFirst({
		where: eq(classSeries.id, seriesId),
	})
	if (!s) return null

	const sp = await db
		.select({ userId: classSeriesPresenter.userId })
		.from(classSeriesPresenter)
		.where(eq(classSeriesPresenter.seriesId, seriesId))

	const sl = await db
		.select()
		.from(classSeriesLink)
		.where(eq(classSeriesLink.seriesId, seriesId))

	const sessions = await db
		.select()
		.from(classSession)
		.where(eq(classSession.seriesId, seriesId))
		.orderBy(classSession.partNumber)

	const sessionIds = sessions.map((x) => x.id)

	const sessPresenters = sessionIds.length
		? await db
				.select({
					sessionId: classSessionPresenter.sessionId,
					userId: classSessionPresenter.userId,
				})
				.from(classSessionPresenter)
				.where(inArray(classSessionPresenter.sessionId, sessionIds))
		: []

	const sessLinks = sessionIds.length
		? await db
				.select()
				.from(classSessionLink)
				.where(inArray(classSessionLink.sessionId, sessionIds))
		: []

	const handouts = sessionIds.length
		? await db
				.select()
				.from(classSessionHandout)
				.where(inArray(classSessionHandout.sessionId, sessionIds))
		: []

	const series: UISeries = {
		...s,
		presenterIds: sp.map((x) => x.userId),
		links: sl.map((x) => ({ id: x.id, label: x.label, url: x.url })),
	}

	const sessionsUI: UISession[] = sessions.map((sess) => ({
		...sess,
		presenterIds: sessPresenters
			.filter((p) => p.sessionId === sess.id)
			.map((p) => p.userId),
		links: sessLinks
			.filter((l) => l.sessionId === sess.id)
			.map((l) => ({ id: l.id, label: l.label, url: l.url })),
		handouts: handouts
			.filter((h) => h.sessionId === sess.id)
			.map((h) => ({
				id: h.id,
				fileName: h.fileName,
				filePath: h.filePath,
				publicUrl: h.publicUrl ?? null,
			})),
	}))

	return { series, sessions: sessionsUI }
}

// For admin table (or later)
export async function listSeries(): Promise<UISeries[]> {
	const rows = await db
		.select()
		.from(classSeries)
		.orderBy(desc(classSeries.createdAt))

	// presenters + links omitted here for speed; load on demand
	return rows.map((r) => ({ ...r, presenterIds: [], links: [] }))
}

// -----------------------
// CREATE
// -----------------------
export async function insertSeries(
	currentUserId: string,
	input: SeriesUpsertInput,
	opts: { requireApproval: boolean }
) {
	if (!(await canCreateClass(currentUserId))) {
		throw new Error('Not allowed to create classes.')
	}

	const now = new Date()
	const status: 'draft' | 'published' = opts.requireApproval
		? 'draft'
		: 'published'

	const [series] = await db
		.insert(classSeries)
		.values({
			createdByUserId: currentUserId,
			status,
			title: input.title,
			description: input.description,
			location: input.location,
			zoomUrl: input.zoomUrl,
			recordingUrl: input.recordingUrl,
			coverImageUrl: input.coverImageUrl,
			coverImagePath: input.coverImagePath,
			createdAt: now,
			updatedAt: now,
		})
		.returning({ id: classSeries.id })

	const seriesId = series.id

	if (input.presenterIds.length) {
		await db.insert(classSeriesPresenter).values(
			input.presenterIds.map((uid) => ({
				seriesId,
				userId: uid,
			}))
		)
	}

	if (input.links.length) {
		await db.insert(classSeriesLink).values(
			input.links.map((l) => ({
				seriesId,
				label: l.label,
				url: l.url,
				createdAt: now,
			}))
		)
	}

	// sessions
	for (const sess of input.sessions) {
		const [created] = await db
			.insert(classSession)
			.values({
				seriesId,
				partNumber: sess.partNumber,
				startsAt: new Date(sess.startsAt),
				durationMinutes: sess.durationMinutes,
				status: sess.status,
				canceledReason: sess.canceledReason,
				titleOverride: sess.titleOverride,
				descriptionOverride: sess.descriptionOverride,
				locationOverride: sess.locationOverride,
				zoomUrlOverride: sess.zoomUrlOverride,
				recordingUrlOverride: sess.recordingUrlOverride,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: classSession.id })

		const sessionId = created.id

		if (sess.presenterIds.length) {
			await db.insert(classSessionPresenter).values(
				sess.presenterIds.map((uid) => ({
					sessionId,
					userId: uid,
				}))
			)
		}

		if (sess.links.length) {
			await db.insert(classSessionLink).values(
				sess.links.map((l) => ({
					sessionId,
					label: l.label,
					url: l.url,
					createdAt: now,
				}))
			)
		}

		if (sess.handouts.length) {
			await db.insert(classSessionHandout).values(
				sess.handouts.map((h) => ({
					sessionId,
					fileName: h.fileName,
					filePath: h.filePath,
					publicUrl: h.publicUrl,
					createdAt: now,
				}))
			)
		}
	}

	return seriesId
}

// -----------------------
// UPDATE
// -----------------------
export async function updateSeries(
	currentUserId: string,
	seriesId: string,
	input: SeriesUpsertInput,
	opts: { canApprove: boolean }
) {
	if (!(await canManageSeries(currentUserId, seriesId))) {
		throw new Error('Not allowed to update this class.')
	}

	const now = new Date()

	// series patch
	const patch: Partial<typeof classSeries.$inferInsert> = {
		title: input.title,
		description: input.description,
		location: input.location,
		zoomUrl: input.zoomUrl,
		recordingUrl: input.recordingUrl,
		coverImageUrl: input.coverImageUrl,
		coverImagePath: input.coverImagePath,
		updatedAt: now,
	}

	// Admin can set status
	if (opts.canApprove && input.status) {
		patch.status = input.status
		if (input.status === 'published') {
			patch.approvedByUserId = currentUserId
			patch.approvedAt = now
		}
	}

	await db.update(classSeries).set(patch).where(eq(classSeries.id, seriesId))

	// presenters: simplest = replace all
	await db
		.delete(classSeriesPresenter)
		.where(eq(classSeriesPresenter.seriesId, seriesId))
	if (input.presenterIds.length) {
		await db
			.insert(classSeriesPresenter)
			.values(input.presenterIds.map((uid) => ({ seriesId, userId: uid })))
	}

	// series links: simplest = replace all
	await db.delete(classSeriesLink).where(eq(classSeriesLink.seriesId, seriesId))
	if (input.links.length) {
		await db.insert(classSeriesLink).values(
			input.links.map((l) => ({
				seriesId,
				label: l.label,
				url: l.url,
				createdAt: now,
			}))
		)
	}

	// deletions requested by UI
	if (input.deletedSessionIds?.length) {
		await db
			.delete(classSession)
			.where(inArray(classSession.id, input.deletedSessionIds))
	}
	if (input.deletedHandoutIds?.length) {
		await db
			.delete(classSessionHandout)
			.where(inArray(classSessionHandout.id, input.deletedHandoutIds))
	}

	// upsert sessions
	for (const sess of input.sessions) {
		if (sess.id) {
			await db
				.update(classSession)
				.set({
					partNumber: sess.partNumber,
					startsAt: new Date(sess.startsAt),
					durationMinutes: sess.durationMinutes,
					status: sess.status,
					canceledReason: sess.canceledReason,
					titleOverride: sess.titleOverride,
					descriptionOverride: sess.descriptionOverride,
					locationOverride: sess.locationOverride,
					zoomUrlOverride: sess.zoomUrlOverride,
					recordingUrlOverride: sess.recordingUrlOverride,
					updatedAt: now,
				})
				.where(eq(classSession.id, sess.id))

			// presenters replace
			await db
				.delete(classSessionPresenter)
				.where(eq(classSessionPresenter.sessionId, sess.id))
			if (sess.presenterIds.length) {
				await db.insert(classSessionPresenter).values(
					sess.presenterIds.map((uid) => ({
						sessionId: sess.id!,
						userId: uid,
					}))
				)
			}

			// links replace
			await db
				.delete(classSessionLink)
				.where(eq(classSessionLink.sessionId, sess.id))
			if (sess.links.length) {
				await db.insert(classSessionLink).values(
					sess.links.map((l) => ({
						sessionId: sess.id!,
						label: l.label,
						url: l.url,
						createdAt: now,
					}))
				)
			}

			// handouts: simplest = replace all handouts for that session
			await db
				.delete(classSessionHandout)
				.where(eq(classSessionHandout.sessionId, sess.id))
			if (sess.handouts.length) {
				await db.insert(classSessionHandout).values(
					sess.handouts.map((h) => ({
						sessionId: sess.id!,
						fileName: h.fileName,
						filePath: h.filePath,
						publicUrl: h.publicUrl,
						createdAt: now,
					}))
				)
			}
		} else {
			// create session
			await db.insert(classSession).values({
				seriesId,
				partNumber: sess.partNumber,
				startsAt: new Date(sess.startsAt),
				durationMinutes: sess.durationMinutes,
				status: sess.status,
				canceledReason: sess.canceledReason,
				titleOverride: sess.titleOverride,
				descriptionOverride: sess.descriptionOverride,
				locationOverride: sess.locationOverride,
				zoomUrlOverride: sess.zoomUrlOverride,
				recordingUrlOverride: sess.recordingUrlOverride,
				createdAt: now,
				updatedAt: now,
			})
			// (UI can refresh to see IDs; if you want true upsert, return created IDs)
		}
	}
}

export async function deleteSeries(currentUserId: string, seriesId: string) {
	if (!(await canManageSeries(currentUserId, seriesId))) {
		throw new Error('Not allowed to delete this class.')
	}
	await db.delete(classSeries).where(eq(classSeries.id, seriesId))
}

export async function listSeriesForTable(): Promise<UISeriesTableRow[]> {
	// --- 1. Series + earliest session ---
	const rows = await db
		.select({
			id: classSeries.id,
			title: classSeries.title,
			status: classSeries.status,
			createdByUserId: classSeries.createdByUserId,
			startsAt: min(classSession.startsAt),
		})
		.from(classSeries)
		.leftJoin(classSession, eq(classSession.seriesId, classSeries.id))
		.groupBy(
			classSeries.id,
			classSeries.title,
			classSeries.status,
			classSeries.createdByUserId
		)
		.orderBy(asc(classSeries.title))

	// --- 2. Presenters (separate query) ---
	const presenterRows = await db
		.select({
			seriesId: classSeriesPresenter.seriesId,
			name: user.name,
			username: user.username,
		})
		.from(classSeriesPresenter)
		.innerJoin(user, eq(user.id, classSeriesPresenter.userId))

	const presentersBySeries = new Map<string, string[]>()

	for (const r of presenterRows) {
		const label = r.name ?? r.username ?? 'Unknown'
		const arr = presentersBySeries.get(r.seriesId) ?? []
		arr.push(label)
		presentersBySeries.set(r.seriesId, arr)
	}

	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		status: r.status === 'published' ? 'published' : 'draft',
		startsAt: r.startsAt ?? null,
		presenters: presentersBySeries.get(r.id) ?? [],
		createdByUserId: r.createdByUserId,
	}))
}
