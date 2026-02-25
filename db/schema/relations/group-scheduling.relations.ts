import { relations } from 'drizzle-orm'
import {
	groupScheduleEventNotes,
	groupScheduleEvents,
	groupScheduleEventWards,
	unitContacts,
} from '../tables/group-scheduling'
import { user } from '../tables/auth'
import { stakes, wards } from '../tables/faith'

export const unitContactsRelations = relations(unitContacts, ({ one }) => ({
	stake: one(stakes, {
		fields: [unitContacts.stakeId],
		references: [stakes.id],
	}),
	ward: one(wards, {
		fields: [unitContacts.wardId],
		references: [wards.id],
	}),
	createdBy: one(user, {
		fields: [unitContacts.createdByUserId],
		references: [user.id],
	}),
	updatedBy: one(user, {
		fields: [unitContacts.updatedByUserId],
		references: [user.id],
	}),
}))

export const groupScheduleEventsRelations = relations(
	groupScheduleEvents,
	({ one, many }) => ({
		stake: one(stakes, {
			fields: [groupScheduleEvents.stakeId],
			references: [stakes.id],
		}),
		ward: one(wards, {
			fields: [groupScheduleEvents.wardId],
			references: [wards.id],
		}),
		createdBy: one(user, {
			fields: [groupScheduleEvents.createdByUserId],
			references: [user.id],
		}),
		updatedBy: one(user, {
			fields: [groupScheduleEvents.updatedByUserId],
			references: [user.id],
		}),
		primaryAssistant: one(user, {
			fields: [groupScheduleEvents.primaryAssistantUserId],
			references: [user.id],
		}),
		secondaryAssistant: one(user, {
			fields: [groupScheduleEvents.secondaryAssistantUserId],
			references: [user.id],
		}),
		notes: many(groupScheduleEventNotes),
		eventWards: many(groupScheduleEventWards),
	})
)

export const groupScheduleEventWardsRelations = relations(
	groupScheduleEventWards,
	({ one }) => ({
		event: one(groupScheduleEvents, {
			fields: [groupScheduleEventWards.eventId],
			references: [groupScheduleEvents.id],
		}),
		ward: one(wards, {
			fields: [groupScheduleEventWards.wardId],
			references: [wards.id],
		}),
	})
)

export const groupScheduleEventNotesRelations = relations(
	groupScheduleEventNotes,
	({ one }) => ({
		event: one(groupScheduleEvents, {
			fields: [groupScheduleEventNotes.eventId],
			references: [groupScheduleEvents.id],
		}),
		author: one(user, {
			fields: [groupScheduleEventNotes.authorUserId],
			references: [user.id],
		}),
	})
)
