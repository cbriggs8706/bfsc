// db/schema/tables/kiosk.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	boolean,
	integer,
	unique,
} from 'drizzle-orm/pg-core'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { user } from './auth' // your existing user table
import { faiths, positions, wards } from './faith'

export const kioskPeople = pgTable('kiosk_people', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
	fullName: text('full_name').notNull(),
	email: text('email'),
	phone: text('phone'),

	passcode: varchar('passcode', { length: 6 }).unique(), // 6-digit passcode, optional, must be numeric if present
	isConsultantCached: boolean('is_consultant_cached').notNull().default(false), // derived from user.role but cached for quick kiosk logic
	profileImageUrl: text('profile_image_url'),
	languagesSpoken: text('languages_spoken')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),

	faithId: uuid('faith_id').references(() => faiths.id, {
		onDelete: 'set null',
	}),
	wardId: uuid('ward_id').references(() => wards.id, { onDelete: 'set null' }),
	notes: text('notes'),

	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export type KioskPeopleInsert = InferInsertModel<typeof kioskPeople>
export type KioskPeopleSelect = InferSelectModel<typeof kioskPeople>

// If you want a stronger DB-level check for numeric 6-digits:
export const kioskPeopleConstraints = sql`
  ALTER TABLE "kiosk_people"
  ADD CONSTRAINT kiosk_people_passcode_numeric
  CHECK (passcode IS NULL OR passcode ~ '^[0-9]{6}$')
`

export const kioskVisitPurposes = pgTable('kiosk_visit_purposes', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const kioskVisitLogs = pgTable('kiosk_visit_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id')
		.notNull()
		.references(() => kioskPeople.id, { onDelete: 'cascade' }),
	// If this visitor is also a real app user, capture user.id here
	userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
	purposeId: integer('purpose_id').references(() => kioskVisitPurposes.id, {
		onDelete: 'set null',
	}),
	mailingListOptIn: boolean('mailing_list_opt_in').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	// If you ever want to log exit time for patrons later:
	// departedAt: timestamp('departed_at', { withTimezone: true }),
	notes: text('notes'),
})

export const kioskShiftLogs = pgTable('kiosk_shift_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id')
		.notNull()
		.references(() => kioskPeople.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	arrivalAt: timestamp('arrival_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	expectedDepartureAt: timestamp('expected_departure_at', {
		withTimezone: true,
	}).notNull(),
	// optional override if a director manually closes the shift later
	actualDepartureAt: timestamp('actual_departure_at', {
		withTimezone: true,
	}),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	notes: text('notes'),
})

export const kioskPersonPositions = pgTable(
	'kiosk_person_positions',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		personId: uuid('person_id')
			.notNull()
			.references(() => kioskPeople.id, { onDelete: 'cascade' }),

		positionId: uuid('position_id')
			.notNull()
			.references(() => positions.id, { onDelete: 'cascade' }),

		// Optional but VERY useful
		sustainedAt: timestamp('sustained_at', { withTimezone: true }),
		releasedAt: timestamp('released_at', { withTimezone: true }),
	},
	(table) => ({
		// Prevent duplicate assignments
		uniqueAssignment: unique().on(table.personId, table.positionId),
	})
)
