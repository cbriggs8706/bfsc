import {
	boolean,
	check,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { stakes, wards } from './faith'
import { user } from './auth'

export const unitContacts = pgTable(
	'unit_contacts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		stakeId: uuid('stake_id').references(() => stakes.id, {
			onDelete: 'set null',
		}),
		wardId: uuid('ward_id').references(() => wards.id, {
			onDelete: 'set null',
		}),
		role: text('role').notNull(),
		name: text('name').notNull(),
		phone: text('phone'),
		email: text('email'),
		preferredContactMethod: varchar('preferred_contact_method', {
			length: 20,
		})
			.notNull()
			.default('phone'),
		bestContactTimes: text('best_contact_times'),
		notes: text('notes'),
		isPrimary: boolean('is_primary').notNull().default(false),
		isPublic: boolean('is_public').notNull().default(false),
		lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
		createdByUserId: uuid('created_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		updatedByUserId: uuid('updated_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		unitContactScopeCheck: check(
			'unit_contact_scope_ck',
			sql`
				(
					(${t.stakeId} is not null and ${t.wardId} is null)
					or
					(${t.stakeId} is null and ${t.wardId} is not null)
				)
			`
		),
		unitContactMethodCheck: check(
			'unit_contact_method_ck',
			sql`${t.preferredContactMethod} in ('phone', 'email', 'text')`
		),
		stakeIdx: index('unit_contacts_stake_idx').on(t.stakeId),
		wardIdx: index('unit_contacts_ward_idx').on(t.wardId),
		roleIdx: index('unit_contacts_role_idx').on(t.role),
		publicIdx: index('unit_contacts_public_idx').on(t.isPublic),
	})
)

export const groupScheduleEvents = pgTable(
	'group_schedule_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		stakeId: uuid('stake_id')
			.notNull()
			.references(() => stakes.id, { onDelete: 'restrict' }),
		wardId: uuid('ward_id').references(() => wards.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		status: varchar('status', { length: 30 }).notNull().default('tentative'),
		coordinationStatus: varchar('coordination_status', { length: 30 })
			.notNull()
			.default('needs_contact'),
		primaryAssistantUserId: uuid('primary_assistant_user_id').references(
			() => user.id,
			{ onDelete: 'set null' }
		),
		secondaryAssistantUserId: uuid('secondary_assistant_user_id').references(
			() => user.id,
			{ onDelete: 'set null' }
		),
		planningNotes: text('planning_notes'),
		internalNotes: text('internal_notes'),
		createdByUserId: uuid('created_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		updatedByUserId: uuid('updated_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		statusCheck: check(
			'group_schedule_event_status_ck',
			sql`${t.status} in ('tentative','pending_confirmation','confirmed','completed','canceled')`
		),
		coordinationStatusCheck: check(
			'group_schedule_event_coordination_status_ck',
			sql`${t.coordinationStatus} in ('needs_contact','contacted','awaiting_response','proposed_times_sent','confirmed','reschedule_requested','canceled')`
		),
		timingCheck: check(
			'group_schedule_event_timing_ck',
			sql`
				(
					${t.status} = 'tentative'
					and (${t.endsAt} is null or ${t.endsAt} > ${t.startsAt})
				)
				or
				(
					${t.status} <> 'tentative'
					and ${t.endsAt} is not null
					and ${t.endsAt} > ${t.startsAt}
				)
			`
		),
		stakeIdx: index('group_schedule_events_stake_idx').on(t.stakeId),
		wardIdx: index('group_schedule_events_ward_idx').on(t.wardId),
		startIdx: index('group_schedule_events_start_idx').on(t.startsAt),
		statusIdx: index('group_schedule_events_status_idx').on(t.status),
		primaryAssistantIdx: index('group_schedule_events_primary_assistant_idx').on(
			t.primaryAssistantUserId
		),
		secondaryAssistantIdx: index(
			'group_schedule_events_secondary_assistant_idx'
		).on(t.secondaryAssistantUserId),
	})
)

export const groupScheduleEventWards = pgTable(
	'group_schedule_event_wards',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => groupScheduleEvents.id, { onDelete: 'cascade' }),
		wardId: uuid('ward_id')
			.notNull()
			.references(() => wards.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		eventIdx: index('group_schedule_event_wards_event_idx').on(t.eventId),
		wardIdx: index('group_schedule_event_wards_ward_idx').on(t.wardId),
		eventWardUnique: uniqueIndex('group_schedule_event_wards_unique_idx').on(
			t.eventId,
			t.wardId
		),
	})
)

export const groupScheduleEventNotes = pgTable(
	'group_schedule_event_notes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => groupScheduleEvents.id, { onDelete: 'cascade' }),
		authorUserId: uuid('author_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		visibility: varchar('visibility', { length: 20 })
			.notNull()
			.default('coordination'),
		note: text('note').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		visibilityCheck: check(
			'group_schedule_event_note_visibility_ck',
			sql`${t.visibility} in ('coordination','private')`
		),
		eventIdx: index('group_schedule_event_notes_event_idx').on(t.eventId),
	})
)
