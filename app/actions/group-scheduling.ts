'use server'

import { db } from '@/db'
import {
	groupScheduleEventNotes,
	groupScheduleEvents,
	groupScheduleEventWards,
	stakes,
	unitContacts,
	wards,
} from '@/db/schema'
import {
	coordinationStatuses,
	scheduleStatuses,
} from '@/db/queries/group-scheduling'
import { authOptions } from '@/lib/auth'
import { getRoleTemplatesForScope } from '@/lib/group-directory-role-templates'
import { and, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const allowedRoles = ['Admin', 'Director', 'Assistant Director'] as const

async function requireSchedulerUser() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id || !session.user.role) {
		throw new Error('Unauthorized')
	}
	if (!allowedRoles.includes(session.user.role as (typeof allowedRoles)[number])) {
		throw new Error('Forbidden')
	}

	return session.user
}

function localeFromForm(formData: FormData) {
	return String(formData.get('locale') ?? 'en')
}

function revalidateSchedulingPaths(locale: string) {
	revalidatePath(`/${locale}/admin/groups/scheduler`)
	revalidatePath(`/${locale}/admin/groups/directory`)
	revalidatePath(`/${locale}/groups`)
	revalidatePath(`/${locale}/calendar`)
}

function normalizeName(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
}

function canonicalWardName(value: string) {
	return normalizeName(value).replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1').trim()
}

function expandWardExpression(raw: string) {
	const value = raw.trim()
	if (!value) return []

	const expanded: string[] = []
	const segments = value.split(/[|;&]/).map((s) => s.trim()).filter(Boolean)
	let currentPrefix: string | null = null

	for (const segment of segments) {
		const commaParts = segment.split(',').map((p) => p.trim()).filter(Boolean)
		for (const part of commaParts) {
			const rangeWithPrefix = part.match(/^(.+?)\s+(\d+)\s*-\s*(\d+)$/i)
			if (rangeWithPrefix) {
				const prefix = rangeWithPrefix[1].trim()
				const start = Number(rangeWithPrefix[2])
				const end = Number(rangeWithPrefix[3])
				currentPrefix = prefix
				for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
					expanded.push(`${prefix} ${n}`)
				}
				continue
			}

			const rangeNoPrefix = part.match(/^(\d+)\s*-\s*(\d+)$/i)
			if (rangeNoPrefix && currentPrefix) {
				const start = Number(rangeNoPrefix[1])
				const end = Number(rangeNoPrefix[2])
				for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
					expanded.push(`${currentPrefix} ${n}`)
				}
				continue
			}

			const numberedWithPrefix = part.match(/^(.+?)\s+(\d+)$/i)
			if (numberedWithPrefix) {
				currentPrefix = numberedWithPrefix[1].trim()
				expanded.push(`${currentPrefix} ${numberedWithPrefix[2]}`)
				continue
			}

			const ordinalOnly = part.match(/^(\d+)(st|nd|rd|th)?$/i)
			if (ordinalOnly && currentPrefix) {
				expanded.push(`${currentPrefix} ${ordinalOnly[1]}`)
				continue
			}

			currentPrefix = null
			expanded.push(part)
		}
	}

	return expanded.filter(Boolean)
}

function parseCsvLike(text: string) {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)

	if (lines.length < 2) {
		throw new Error('CSV file must include a header row and at least one data row.')
	}

	const delimiter = lines[0].includes('\t') ? '\t' : ','
	const splitLine = (line: string) => {
		if (delimiter === '\t') return line.split('\t').map((v) => v.trim())
		// basic csv support with quoted cells
		const cells: string[] = []
		let current = ''
		let inQuotes = false
		for (let i = 0; i < line.length; i++) {
			const ch = line[i]
			if (ch === '"') {
				const next = line[i + 1]
				if (inQuotes && next === '"') {
					current += '"'
					i++
				} else {
					inQuotes = !inQuotes
				}
				continue
			}
			if (ch === ',' && !inQuotes) {
				cells.push(current.trim())
				current = ''
				continue
			}
			current += ch
		}
		cells.push(current.trim())
		return cells
	}

	const headers = splitLine(lines[0])
	const rows = lines.slice(1).map((line) => splitLine(line))
	return { headers, rows }
}

function parseDateInput(value: string) {
	const v = value.trim()
	if (!v) return null
	if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
		const [year, month, day] = v.split('-').map(Number)
		return new Date(year, month - 1, day, 12, 0, 0, 0)
	}
	if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) {
		const [mm, dd, yy] = v.split('/').map(Number)
		const year = yy < 100 ? 2000 + yy : yy
		return new Date(year, mm - 1, dd, 12, 0, 0, 0)
	}
	const dt = new Date(v)
	if (Number.isNaN(dt.getTime())) return null
	return dt
}

async function shiftGroupScheduleEvent(id: string, deltaDays: number, userId: string) {
	const [existing] = await db
		.select({
			id: groupScheduleEvents.id,
			startsAt: groupScheduleEvents.startsAt,
			endsAt: groupScheduleEvents.endsAt,
		})
		.from(groupScheduleEvents)
		.where(eq(groupScheduleEvents.id, id))
		.limit(1)
	if (!existing) return

	const startsAt = new Date(existing.startsAt)
	const endsAt = existing.endsAt ? new Date(existing.endsAt) : null
	startsAt.setDate(startsAt.getDate() + deltaDays)
	if (endsAt) {
		endsAt.setDate(endsAt.getDate() + deltaDays)
	}

	await db
		.update(groupScheduleEvents)
		.set({
			startsAt,
			endsAt: endsAt ?? null,
			updatedAt: new Date(),
			updatedByUserId: userId,
		})
		.where(eq(groupScheduleEvents.id, id))
}

const dateTimeField = z
	.string()
	.min(1)
	.transform((value) => new Date(value))
	.refine((value) => !Number.isNaN(value.getTime()), {
		message: 'Invalid datetime',
	})

const createEventSchema = z
	.object({
		title: z.string().min(2),
		stakeId: z.string().uuid(),
		wardId: z.string().uuid().optional().or(z.literal('')),
		wardIds: z.array(z.string().uuid()).max(3).optional().default([]),
		primaryAssistantUserId: z.string().uuid().optional().or(z.literal('')),
		secondaryAssistantUserId: z.string().uuid().optional().or(z.literal('')),
		startsAt: dateTimeField,
		endsAt: dateTimeField.optional(),
		status: z.enum(scheduleStatuses),
		coordinationStatus: z.enum(coordinationStatuses),
		planningNotes: z.string().optional(),
		internalNotes: z.string().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.status === 'tentative') {
			if (value.endsAt && value.endsAt <= value.startsAt) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'End time must be after start time',
					path: ['endsAt'],
				})
			}
			return
		}

		if (!value.endsAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End time is required unless tentative',
				path: ['endsAt'],
			})
			return
		}

		if (value.endsAt <= value.startsAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End time must be after start time',
				path: ['endsAt'],
			})
		}
	})

const upsertContactSchema = z.object({
	id: z.string().uuid().optional(),
	stakeId: z.string().uuid().optional().or(z.literal('')),
	wardId: z.string().uuid().optional().or(z.literal('')),
	role: z.string().min(2),
	name: z.string().min(2),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal('')),
	preferredContactMethod: z.enum(['none', 'phone', 'email', 'text']),
	bestContactTimes: z.string().optional(),
	notes: z.string().optional(),
	isPrimary: z
		.string()
		.optional()
		.transform((v) => v === 'on'),
	isPublic: z
		.string()
		.optional()
		.transform((v) => v === 'on'),
})

const upsertScopedContactsSchema = z.object({
	scopeType: z.enum(['stake', 'ward']),
	scopeId: z.string().uuid(),
})

const noteSchema = z.object({
	eventId: z.string().uuid(),
	note: z.string().min(2),
	visibility: z.enum(['coordination', 'private']),
})

export async function createGroupScheduleEvent(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const wardIds = Array.from(
		new Set(
			formData
				.getAll('wardIds')
				.map((v) => String(v))
				.filter(Boolean)
		)
	)
	const parsed = createEventSchema.parse({
		title: formData.get('title'),
		stakeId: formData.get('stakeId'),
		wardId: formData.get('wardId') ?? '',
		wardIds,
		primaryAssistantUserId: formData.get('primaryAssistantUserId'),
		secondaryAssistantUserId: formData.get('secondaryAssistantUserId'),
		startsAt: formData.get('startsAt'),
		endsAt: formData.get('endsAt') || undefined,
		status: formData.get('status'),
		coordinationStatus: formData.get('coordinationStatus'),
		planningNotes: formData.get('planningNotes'),
		internalNotes: formData.get('internalNotes'),
	})

	const primaryWardId = parsed.wardIds[0] ?? (parsed.wardId || null)
	const [created] = await db
		.insert(groupScheduleEvents)
		.values({
		title: parsed.title,
		stakeId: parsed.stakeId,
		wardId: primaryWardId,
		primaryAssistantUserId: parsed.primaryAssistantUserId || null,
		secondaryAssistantUserId: parsed.secondaryAssistantUserId || null,
		startsAt: parsed.startsAt,
		endsAt: parsed.endsAt ?? null,
		status: parsed.status,
		coordinationStatus: parsed.coordinationStatus,
		planningNotes: parsed.planningNotes || null,
		internalNotes: parsed.internalNotes || null,
		createdByUserId: user.id,
		updatedByUserId: user.id,
		})
		.returning({ id: groupScheduleEvents.id })

	if (created && parsed.wardIds.length > 0) {
		await db.insert(groupScheduleEventWards).values(
			parsed.wardIds.map((wardId) => ({
				eventId: created.id,
				wardId,
			}))
		)
	}

	revalidateSchedulingPaths(locale)
}

export async function bulkImportGroupScheduleEvents(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const status = z.enum(scheduleStatuses).parse(
		String(formData.get('status') ?? 'tentative')
	)
	const coordinationStatus = z.enum(coordinationStatuses).parse(
		String(formData.get('coordinationStatus') ?? 'needs_contact')
	)
	const file = formData.get('file')
	if (!(file instanceof File)) {
		throw new Error('Please attach a CSV file.')
	}
	const text = await file.text()
	const { headers, rows } = parseCsvLike(text)
	const headerMap = headers.reduce<Record<string, number>>((acc, header, idx) => {
		acc[normalizeName(header)] = idx
		return acc
	}, {})

	const required = [
		'stake',
		'ward',
		'activity name',
		'start date',
		'end date',
	] as const

	for (const key of required) {
		if (headerMap[normalizeName(key)] === undefined) {
			throw new Error(`Missing header: ${key}`)
		}
	}

	const stakeRows = await db.select({ id: stakes.id, name: stakes.name }).from(stakes)
	const stakeByName = new Map(
		stakeRows.map((row) => [normalizeName(row.name), row] as const)
	)

	const allWardRows = await db
		.select({ id: wards.id, name: wards.name, stakeId: wards.stakeId })
		.from(wards)
	const wardsByStake = allWardRows.reduce<
		Record<string, { id: string; name: string; stakeId: string }[]>
	>((acc, row) => {
		if (!acc[row.stakeId]) acc[row.stakeId] = []
		acc[row.stakeId].push(row)
		return acc
	}, {})

	const eventsToInsert: (typeof groupScheduleEvents.$inferInsert)[] = []
	const rowWardIds: string[][] = []
	const errors: string[] = []

	const stakeIdx = headerMap[normalizeName('Stake')]
	const wardIdx = headerMap[normalizeName('Ward')]
	const activityIdx = headerMap[normalizeName('Activity Name')]
	const startIdx = headerMap[normalizeName('Start Date')]
	const endIdx = headerMap[normalizeName('End Date')]

	rows.forEach((row, index) => {
		const lineNo = index + 2
		const stakeName = String(row[stakeIdx] ?? '').trim()
		const wardValue = String(row[wardIdx] ?? '').trim()
		const title = String(row[activityIdx] ?? '').trim()
		const startRaw = String(row[startIdx] ?? '').trim()
		const endRaw = String(row[endIdx] ?? '').trim()

		if (!stakeName || !title || !startRaw) {
			errors.push(`Row ${lineNo}: Stake, Activity Name, and Start Date are required.`)
			return
		}

		const stake = stakeByName.get(normalizeName(stakeName))
		if (!stake) {
			errors.push(`Row ${lineNo}: Stake not found (${stakeName}).`)
			return
		}

		const startsAt = parseDateInput(startRaw)
		if (!startsAt) {
			errors.push(`Row ${lineNo}: Invalid Start Date (${startRaw}).`)
			return
		}

		const endsAt = parseDateInput(endRaw)
		if (status !== 'tentative' && !endsAt) {
			errors.push(`Row ${lineNo}: End Date required for non-tentative import status.`)
			return
		}
		if (endsAt && endsAt <= startsAt) {
			endsAt.setHours(endsAt.getHours() + 1)
		}

		const wardCandidates = (wardsByStake[stake.id] ?? []).map((w) => ({
			...w,
			normalized: normalizeName(w.name),
			canonical: canonicalWardName(w.name),
		}))
		let matchedWardIds: string[] = []
		const wardValueNorm = normalizeName(wardValue)
		if (wardValueNorm.includes('all ysa')) {
			matchedWardIds = wardCandidates
				.filter((ward) => ward.normalized.includes('ysa'))
				.map((ward) => ward.id)
		} else {
			const requestedWardNames = expandWardExpression(wardValue).slice(0, 3)
			matchedWardIds = requestedWardNames
				.map((name) => {
					const n = normalizeName(name)
					const c = canonicalWardName(name)
					return (
						wardCandidates.find((ward) => ward.canonical === c)?.id ??
						wardCandidates.find((ward) => ward.normalized === n)?.id ??
						wardCandidates.find((ward) => ward.canonical.includes(c))?.id ??
						wardCandidates.find((ward) => ward.normalized.includes(n))?.id
					)
				})
				.filter(Boolean) as string[]

			if (requestedWardNames.length > 0 && matchedWardIds.length === 0) {
				errors.push(
					`Row ${lineNo}: No ward matches for "${wardValue}" in ${stakeName}.`
				)
				return
			}
		}

		eventsToInsert.push({
			title,
			stakeId: stake.id,
			wardId: matchedWardIds[0] ?? null,
			startsAt,
			endsAt: endsAt ?? null,
			status,
			coordinationStatus,
			createdByUserId: user.id,
			updatedByUserId: user.id,
			primaryAssistantUserId: null,
			secondaryAssistantUserId: null,
			planningNotes: null,
			internalNotes: null,
		})
		rowWardIds.push(matchedWardIds)
	})

	if (errors.length > 0) {
		throw new Error(errors.slice(0, 10).join(' '))
	}
	if (eventsToInsert.length === 0) {
		throw new Error('No valid rows found to import.')
	}

	const created = await db
		.insert(groupScheduleEvents)
		.values(eventsToInsert)
		.returning({ id: groupScheduleEvents.id })

	const wardLinks = created.flatMap((event, idx) =>
		(rowWardIds[idx] ?? []).map((wardId) => ({
			eventId: event.id,
			wardId,
		}))
	)

	if (wardLinks.length > 0) {
		const deduped = wardLinks.filter(
			(link, idx, all) =>
				all.findIndex(
					(item) => item.eventId === link.eventId && item.wardId === link.wardId
				) === idx
		)
		await db.insert(groupScheduleEventWards).values(deduped)
	}

	revalidateSchedulingPaths(locale)
}

export async function updateGroupScheduleEvent(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	if (!id) throw new Error('Missing event id')

	const wardIds = Array.from(
		new Set(
			formData
				.getAll('wardIds')
				.map((v) => String(v))
				.filter(Boolean)
		)
	)
	const parsed = createEventSchema.parse({
		title: formData.get('title'),
		stakeId: formData.get('stakeId'),
		wardId: formData.get('wardId') ?? '',
		wardIds,
		primaryAssistantUserId: formData.get('primaryAssistantUserId'),
		secondaryAssistantUserId: formData.get('secondaryAssistantUserId'),
		startsAt: formData.get('startsAt'),
		endsAt: formData.get('endsAt') || undefined,
		status: formData.get('status'),
		coordinationStatus: formData.get('coordinationStatus'),
		planningNotes: formData.get('planningNotes'),
		internalNotes: formData.get('internalNotes'),
	})
	const primaryWardId = parsed.wardIds[0] ?? (parsed.wardId || null)

	await db
		.update(groupScheduleEvents)
		.set({
			title: parsed.title,
			stakeId: parsed.stakeId,
			wardId: primaryWardId,
			primaryAssistantUserId: parsed.primaryAssistantUserId || null,
			secondaryAssistantUserId: parsed.secondaryAssistantUserId || null,
			startsAt: parsed.startsAt,
			endsAt: parsed.endsAt ?? null,
			status: parsed.status,
			coordinationStatus: parsed.coordinationStatus,
			planningNotes: parsed.planningNotes || null,
			internalNotes: parsed.internalNotes || null,
			updatedAt: new Date(),
			updatedByUserId: user.id,
		})
		.where(eq(groupScheduleEvents.id, id))

	await db
		.delete(groupScheduleEventWards)
		.where(eq(groupScheduleEventWards.eventId, id))

	if (parsed.wardIds.length > 0) {
		await db.insert(groupScheduleEventWards).values(
			parsed.wardIds.map((wardId) => ({
				eventId: id,
				wardId,
			}))
		)
	}

	revalidateSchedulingPaths(locale)
}

export async function shiftGroupScheduleEventByWeek(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	const direction = String(formData.get('direction') ?? 'forward')
	if (!id) return

	const delta = direction === 'back' ? -7 : 7
	await shiftGroupScheduleEvent(id, delta, user.id)

	revalidateSchedulingPaths(locale)
}

export async function shiftGroupScheduleEventByDays(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	const deltaDays = Number(formData.get('deltaDays') ?? 0)
	if (!id || !Number.isFinite(deltaDays) || deltaDays === 0) return

	await shiftGroupScheduleEvent(id, deltaDays, user.id)
	revalidateSchedulingPaths(locale)
}

export async function duplicateGroupScheduleEventNextWeek(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	if (!id) return

	const [existing] = await db
		.select()
		.from(groupScheduleEvents)
		.where(eq(groupScheduleEvents.id, id))
		.limit(1)
	if (!existing) return

	const startsAt = new Date(existing.startsAt)
	const endsAt = existing.endsAt ? new Date(existing.endsAt) : null
	startsAt.setDate(startsAt.getDate() + 7)
	if (endsAt) {
		endsAt.setDate(endsAt.getDate() + 7)
	}

	const [created] = await db
		.insert(groupScheduleEvents)
		.values({
		title: existing.title,
		stakeId: existing.stakeId,
		wardId: existing.wardId,
		primaryAssistantUserId: existing.primaryAssistantUserId,
		secondaryAssistantUserId: existing.secondaryAssistantUserId,
		startsAt,
		endsAt: endsAt ?? null,
		status: 'tentative',
		coordinationStatus: 'needs_contact',
		planningNotes: existing.planningNotes,
		internalNotes: existing.internalNotes,
		createdByUserId: user.id,
		updatedByUserId: user.id,
		})
		.returning({ id: groupScheduleEvents.id })

	if (created) {
		const linkedWards = await db
			.select({ wardId: groupScheduleEventWards.wardId })
			.from(groupScheduleEventWards)
			.where(eq(groupScheduleEventWards.eventId, existing.id))

		if (linkedWards.length > 0) {
			await db.insert(groupScheduleEventWards).values(
				linkedWards.map((w) => ({
					eventId: created.id,
					wardId: w.wardId,
				}))
			)
		}
	}

	revalidateSchedulingPaths(locale)
}

export async function createGroupScheduleNote(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()

	const parsed = noteSchema.parse({
		eventId: formData.get('eventId'),
		note: formData.get('note'),
		visibility: formData.get('visibility'),
	})

	await db.insert(groupScheduleEventNotes).values({
		eventId: parsed.eventId,
		note: parsed.note,
		visibility: parsed.visibility,
		authorUserId: user.id,
	})

	revalidateSchedulingPaths(locale)
}

export async function setGroupScheduleEventCoordinationStatus(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	const coordinationStatus = z.enum(coordinationStatuses).parse(
		String(formData.get('coordinationStatus') ?? '')
	)
	if (!id) return

	const [existing] = await db
		.select({
			id: groupScheduleEvents.id,
			status: groupScheduleEvents.status,
			endsAt: groupScheduleEvents.endsAt,
		})
		.from(groupScheduleEvents)
		.where(eq(groupScheduleEvents.id, id))
		.limit(1)
	if (!existing) return

	const nextStatus =
		coordinationStatus === 'confirmed' &&
		Boolean(existing.endsAt) &&
		(existing.status === 'tentative' || existing.status === 'pending_confirmation')
			? 'confirmed'
			: existing.status

	await db
		.update(groupScheduleEvents)
		.set({
			coordinationStatus,
			status: nextStatus,
			updatedAt: new Date(),
			updatedByUserId: user.id,
		})
		.where(eq(groupScheduleEvents.id, id))

	revalidateSchedulingPaths(locale)
}

export async function upsertUnitContact(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const parsed = upsertContactSchema.parse({
		id: formData.get('id'),
		stakeId: formData.get('stakeId'),
		wardId: formData.get('wardId'),
		role: formData.get('role'),
		name: formData.get('name'),
		phone: formData.get('phone'),
		email: formData.get('email'),
		preferredContactMethod: formData.get('preferredContactMethod'),
		bestContactTimes: formData.get('bestContactTimes'),
		notes: formData.get('notes'),
		isPrimary: formData.get('isPrimary')?.toString(),
		isPublic: formData.get('isPublic')?.toString(),
	})

	const scope = {
		stakeId: parsed.stakeId || null,
		wardId: parsed.wardId || null,
	}
	if ((scope.stakeId && scope.wardId) || (!scope.stakeId && !scope.wardId)) {
		throw new Error('Select either a stake or a ward')
	}

	const values = {
		...scope,
		role: parsed.role,
		name: parsed.name,
		phone: parsed.phone || null,
		email: parsed.email || null,
		preferredContactMethod: parsed.preferredContactMethod,
		bestContactTimes: parsed.bestContactTimes || null,
		notes: parsed.notes || null,
		isPrimary: parsed.isPrimary,
		isPublic: parsed.isPublic,
		lastVerifiedAt: new Date(),
		updatedAt: new Date(),
		updatedByUserId: user.id,
	}

	if (parsed.id) {
		await db.update(unitContacts).set(values).where(eq(unitContacts.id, parsed.id))
	} else {
		await db.insert(unitContacts).values({
			...values,
			createdByUserId: user.id,
		})
	}

	revalidateSchedulingPaths(locale)
}

export async function upsertScopedUnitContacts(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const parsedScope = upsertScopedContactsSchema.parse({
		scopeType: formData.get('scopeType'),
		scopeId: formData.get('scopeId'),
	})
	const roles = getRoleTemplatesForScope(parsedScope.scopeType)
	const scopeValues = {
		stakeId: parsedScope.scopeType === 'stake' ? parsedScope.scopeId : null,
		wardId: parsedScope.scopeType === 'ward' ? parsedScope.scopeId : null,
	}
	const resolvePreferredContactMethod = (
		rawPreferredContactMethod: string
	): 'phone' | 'email' | 'text' | 'none' => {
		if (['phone', 'email', 'text', 'none'].includes(rawPreferredContactMethod)) {
			return rawPreferredContactMethod as 'phone' | 'email' | 'text' | 'none'
		}
		return 'none'
	}

	for (const [index, role] of roles.entries()) {
		const idValue = String(formData.get(`id_${index}`) ?? '').trim()
		const name = String(formData.get(`name_${index}`) ?? '').trim()
		const phone = String(formData.get(`phone_${index}`) ?? '').trim()
		const email = String(formData.get(`email_${index}`) ?? '').trim()
		const preferredContactMethod = String(
			formData.get(`preferredContactMethod_${index}`) ?? ''
		).trim()
		const bestContactTimes = String(formData.get(`bestContactTimes_${index}`) ?? '').trim()
		const notes = String(formData.get(`notes_${index}`) ?? '').trim()
		const isPrimary = String(formData.get(`isPrimary_${index}`) ?? '') === 'on'
		const isPublic = String(formData.get(`isPublic_${index}`) ?? '') === 'on'
		const hasContactValue = Boolean(name || phone || email || bestContactTimes || notes)
		const safePreferredContactMethod = resolvePreferredContactMethod(preferredContactMethod)
		const safeEmail = email && z.string().email().safeParse(email).success ? email : null

		if (!hasContactValue) continue

		const values = {
			...scopeValues,
			role,
			name: name || '',
			phone: phone || null,
			email: safeEmail,
			preferredContactMethod: safePreferredContactMethod,
			bestContactTimes: bestContactTimes || null,
			notes: notes || null,
			isPrimary,
			isPublic,
			lastVerifiedAt: new Date(),
			updatedAt: new Date(),
			updatedByUserId: user.id,
		}

		if (idValue) {
			await db.update(unitContacts).set(values).where(eq(unitContacts.id, idValue))
			continue
		}

		await db.insert(unitContacts).values({
			...values,
			createdByUserId: user.id,
		})
	}

	const extraCount = Number(formData.get('extraCount') ?? 0)
	for (let index = 0; index < extraCount; index++) {
		const idValue = String(formData.get(`extraId_${index}`) ?? '').trim()
		const role = String(formData.get(`extraRole_${index}`) ?? '').trim()
		const name = String(formData.get(`extraName_${index}`) ?? '').trim()
		const phone = String(formData.get(`extraPhone_${index}`) ?? '').trim()
		const email = String(formData.get(`extraEmail_${index}`) ?? '').trim()
		const preferredContactMethod = String(
			formData.get(`extraPreferredContactMethod_${index}`) ?? ''
		).trim()
		const isPrimary = String(formData.get(`extraIsPrimary_${index}`) ?? '') === 'on'
		const isPublic = String(formData.get(`extraIsPublic_${index}`) ?? '') === 'on'
		const hasContactValue = Boolean(role || name || phone || email)
		const safePreferredContactMethod = resolvePreferredContactMethod(preferredContactMethod)
		const safeEmail = email && z.string().email().safeParse(email).success ? email : null

		if (!hasContactValue) continue
		if (!role) continue

		const values = {
			...scopeValues,
			role,
			name: name || '',
			phone: phone || null,
			email: safeEmail,
			preferredContactMethod: safePreferredContactMethod,
			bestContactTimes: null,
			notes: null,
			isPrimary,
			isPublic,
			lastVerifiedAt: new Date(),
			updatedAt: new Date(),
			updatedByUserId: user.id,
		}

		if (idValue) {
			await db.update(unitContacts).set(values).where(eq(unitContacts.id, idValue))
			continue
		}

		await db.insert(unitContacts).values({
			...values,
			createdByUserId: user.id,
		})
	}

	revalidateSchedulingPaths(locale)
}

export async function deleteUnitContact(formData: FormData) {
	const locale = localeFromForm(formData)
	await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	if (!id) return
	await db.delete(unitContacts).where(eq(unitContacts.id, id))
	revalidateSchedulingPaths(locale)
}

export async function deleteGroupScheduleEvent(formData: FormData) {
	const locale = localeFromForm(formData)
	await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	if (!id) return
	await db.delete(groupScheduleEvents).where(eq(groupScheduleEvents.id, id))
	revalidateSchedulingPaths(locale)
}

export async function markContactAsVerified(formData: FormData) {
	const locale = localeFromForm(formData)
	const user = await requireSchedulerUser()
	const id = String(formData.get('id') ?? '')
	if (!id) return

	await db
		.update(unitContacts)
		.set({
			lastVerifiedAt: new Date(),
			updatedAt: new Date(),
			updatedByUserId: user.id,
		})
		.where(eq(unitContacts.id, id))

	revalidateSchedulingPaths(locale)
}

export async function clearPrivateEventNotes(formData: FormData) {
	const locale = localeFromForm(formData)
	await requireSchedulerUser()
	const eventId = String(formData.get('eventId') ?? '')
	if (!eventId) return

	await db
		.delete(groupScheduleEventNotes)
		.where(
			and(
				eq(groupScheduleEventNotes.eventId, eventId),
				eq(groupScheduleEventNotes.visibility, 'private')
			)
		)

	revalidateSchedulingPaths(locale)
}
