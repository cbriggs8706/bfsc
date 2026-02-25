'use server'

import { db } from '@/db'
import {
	groupScheduleEventNotes,
	groupScheduleEvents,
	groupScheduleEventWards,
	unitContacts,
} from '@/db/schema'
import {
	coordinationStatuses,
	scheduleStatuses,
} from '@/db/queries/group-scheduling'
import { authOptions } from '@/lib/auth'
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
	revalidatePath(`/${locale}/groups`)
	revalidatePath(`/${locale}/calendar`)
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
	preferredContactMethod: z.enum(['phone', 'email', 'text']),
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
