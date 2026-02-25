import 'server-only'
import { db } from '@/db'
import {
	groupScheduleEventNotes,
	groupScheduleEvents,
	groupScheduleEventWards,
	stakes,
	unitContacts,
	user,
	wards,
} from '@/db/schema'
import {
	aliasedTable,
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	lte,
	or,
} from 'drizzle-orm'

export const scheduleStatuses = [
	'tentative',
	'pending_confirmation',
	'confirmed',
	'completed',
	'canceled',
] as const

export const coordinationStatuses = [
	'needs_contact',
	'contacted',
	'awaiting_response',
	'proposed_times_sent',
	'confirmed',
	'reschedule_requested',
	'canceled',
] as const

export type ScheduleStatus = (typeof scheduleStatuses)[number]
export type CoordinationStatus = (typeof coordinationStatuses)[number]
export type NoteVisibility = 'coordination' | 'private'

export async function getSchedulingWorkspace() {
	const primaryAssistant = aliasedTable(user, 'primary_assistant')
	const secondaryAssistant = aliasedTable(user, 'secondary_assistant')
	const [stakeRows, wardRows, contacts, eventsRaw, notes, assistants, eventWards] =
		await Promise.all([
		db.select({ id: stakes.id, name: stakes.name }).from(stakes).orderBy(stakes.name),
		db
			.select({
				id: wards.id,
				name: wards.name,
				stakeId: wards.stakeId,
				stakeName: stakes.name,
			})
			.from(wards)
			.innerJoin(stakes, eq(wards.stakeId, stakes.id))
			.orderBy(stakes.name, wards.name),
		db
			.select({
				id: unitContacts.id,
				role: unitContacts.role,
				name: unitContacts.name,
				phone: unitContacts.phone,
				email: unitContacts.email,
				preferredContactMethod: unitContacts.preferredContactMethod,
				bestContactTimes: unitContacts.bestContactTimes,
				notes: unitContacts.notes,
				isPrimary: unitContacts.isPrimary,
				isPublic: unitContacts.isPublic,
				lastVerifiedAt: unitContacts.lastVerifiedAt,
				stakeId: unitContacts.stakeId,
				stakeName: stakes.name,
				wardId: unitContacts.wardId,
				wardName: wards.name,
			})
			.from(unitContacts)
			.leftJoin(stakes, eq(unitContacts.stakeId, stakes.id))
			.leftJoin(wards, eq(unitContacts.wardId, wards.id))
			.orderBy(stakes.name, wards.name, unitContacts.role, unitContacts.name),
		db
			.select({
				id: groupScheduleEvents.id,
				title: groupScheduleEvents.title,
				startsAt: groupScheduleEvents.startsAt,
				endsAt: groupScheduleEvents.endsAt,
				status: groupScheduleEvents.status,
				coordinationStatus: groupScheduleEvents.coordinationStatus,
				primaryAssistantUserId: groupScheduleEvents.primaryAssistantUserId,
				primaryAssistantName: primaryAssistant.name,
				secondaryAssistantUserId: groupScheduleEvents.secondaryAssistantUserId,
				secondaryAssistantName: secondaryAssistant.name,
				planningNotes: groupScheduleEvents.planningNotes,
				internalNotes: groupScheduleEvents.internalNotes,
				updatedAt: groupScheduleEvents.updatedAt,
				stakeId: groupScheduleEvents.stakeId,
				stakeName: stakes.name,
				wardId: groupScheduleEvents.wardId,
				wardName: wards.name,
			})
			.from(groupScheduleEvents)
			.innerJoin(stakes, eq(groupScheduleEvents.stakeId, stakes.id))
			.leftJoin(wards, eq(groupScheduleEvents.wardId, wards.id))
			.leftJoin(
				primaryAssistant,
				eq(groupScheduleEvents.primaryAssistantUserId, primaryAssistant.id)
			)
			.leftJoin(
				secondaryAssistant,
				eq(groupScheduleEvents.secondaryAssistantUserId, secondaryAssistant.id)
			)
			.where(
				or(
					gte(groupScheduleEvents.endsAt, new Date()),
					gte(groupScheduleEvents.startsAt, new Date())
				)
			)
			.orderBy(asc(groupScheduleEvents.startsAt)),
		db
			.select({
				id: groupScheduleEventNotes.id,
				eventId: groupScheduleEventNotes.eventId,
				note: groupScheduleEventNotes.note,
				visibility: groupScheduleEventNotes.visibility,
				createdAt: groupScheduleEventNotes.createdAt,
			})
			.from(groupScheduleEventNotes)
			.orderBy(desc(groupScheduleEventNotes.createdAt)),
		db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			})
			.from(user)
			.where(inArray(user.role, ['Admin', 'Director', 'Assistant Director']))
			.orderBy(user.name),
		db
			.select({
				eventId: groupScheduleEventWards.eventId,
				wardId: wards.id,
				wardName: wards.name,
			})
			.from(groupScheduleEventWards)
			.innerJoin(wards, eq(groupScheduleEventWards.wardId, wards.id)),
	])

	const wardMap = eventWards.reduce<
		Record<string, { wardId: string; wardName: string }[]>
	>((acc, row) => {
		if (!acc[row.eventId]) acc[row.eventId] = []
		acc[row.eventId].push({ wardId: row.wardId, wardName: row.wardName })
		return acc
	}, {})

	const events = eventsRaw.map((event) => {
		const linked = wardMap[event.id] ?? []
		return {
			...event,
			wardIds: linked.map((w) => w.wardId),
			wardNames: linked.map((w) => w.wardName),
		}
	})

	return {
		stakes: stakeRows,
		wards: wardRows,
		contacts,
		events,
		notes,
		assistants,
	}
}

export async function getPublicStakeAssistantContacts() {
	return db
		.select({
			id: unitContacts.id,
			role: unitContacts.role,
			name: unitContacts.name,
			phone: unitContacts.phone,
			email: unitContacts.email,
			stakeId: unitContacts.stakeId,
			stakeName: stakes.name,
		})
		.from(unitContacts)
		.innerJoin(stakes, eq(unitContacts.stakeId, stakes.id))
		.where(eq(unitContacts.isPublic, true))
		.orderBy(stakes.name, desc(unitContacts.isPrimary), unitContacts.name)
}

export async function getConfirmedEventsForCalendar(
	rangeStartUtc: Date,
	rangeEndUtc: Date
) {
	return db
		.select({
			id: groupScheduleEvents.id,
			title: groupScheduleEvents.title,
			startsAt: groupScheduleEvents.startsAt,
			stakeName: stakes.name,
			wardName: wards.name,
		})
		.from(groupScheduleEvents)
		.innerJoin(stakes, eq(groupScheduleEvents.stakeId, stakes.id))
		.leftJoin(wards, eq(groupScheduleEvents.wardId, wards.id))
		.where(
			and(
				inArray(groupScheduleEvents.status, ['confirmed', 'completed']),
				gte(groupScheduleEvents.startsAt, rangeStartUtc),
				lte(groupScheduleEvents.startsAt, rangeEndUtc)
			)
		)
}
