// db/schema/tables/shifts.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	boolean,
	integer,
	index,
	uniqueIndex,
	check,
	pgEnum,
	jsonb,
} from 'drizzle-orm/pg-core'
import { user } from './auth' // your existing user table
import { sql } from 'drizzle-orm'

export const shiftTypeEnum = pgEnum('shift_type', ['regular', 'appointment'])

export const operatingHours = pgTable('operating_hours', {
	id: uuid('id').defaultRandom().primaryKey(),
	weekday: integer('weekday').notNull(),
	// 0 = Sunday, 1 = Monday … 6 = Saturday
	opensAt: varchar('opens_at', { length: 5 }).notNull(),
	// "09:00"
	closesAt: varchar('closes_at', { length: 5 }).notNull(),
	// "20:00"
	isClosed: boolean('is_closed').notNull().default(false),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const specialHours = pgTable('special_hours', {
	id: uuid('id').defaultRandom().primaryKey(),
	date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
	isClosed: boolean('is_closed').notNull().default(false),
	reason: text('reason'),
	opensAt: varchar('opens_at', { length: 5 }),
	closesAt: varchar('closes_at', { length: 5 }),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const weeklyShifts = pgTable(
	'weekly_shifts',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		weekday: integer('weekday').notNull(), // 0-6

		startTime: varchar('start_time', { length: 5 }).notNull(), // "10:00"
		endTime: varchar('end_time', { length: 5 }).notNull(), // "14:00"

		isActive: boolean('is_active').notNull().default(true),
		type: shiftTypeEnum('type').notNull().default('regular'),
		notes: varchar('notes', { length: 255 }),

		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),

		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),

		sortOrder: integer('sort_order').notNull().default(0),
	},
	(t) => ({
		weekdayIdx: index('weekly_shifts_weekday_idx').on(t.weekday),
		timeOrder: check(
			'weekly_shifts_time_order_ck',
			sql`${t.endTime} > ${t.startTime}`
		),
		weekdayTypeIdx: index('weekly_shifts_weekday_type_idx').on(
			t.weekday,
			t.type,
			t.isActive
		),
	})
)

export const shiftRecurrences = pgTable(
	'shift_recurrences',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		shiftId: uuid('shift_id')
			.notNull()
			.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

		label: varchar('label', { length: 50 }).notNull(),
		// "Every Sunday", "1st Sunday", "Youth Sunday", etc.

		weekOfMonth: integer('week_of_month'),
		// null = every week
		// 1–5 = ordinal weeks

		isActive: boolean('is_active').notNull().default(true),

		sortOrder: integer('sort_order').notNull().default(0),
	},
	(t) => ({
		shiftIdx: index('shift_recurrences_shift_idx').on(t.shiftId),

		// Prevent duplicate labels per shift
		uniqLabelPerShift: uniqueIndex('shift_recurrences_shift_label_uq').on(
			t.shiftId,
			t.label
		),

		// Prevent duplicate ordinal weeks per shift
		uniqWeekPerShift: uniqueIndex('shift_recurrences_shift_week_uq')
			.on(t.shiftId, t.weekOfMonth)
			.where(sql`${t.weekOfMonth} is not null`),

		// Only one "every week" recurrence per shift
		uniqEveryWeekPerShift: uniqueIndex('shift_recurrences_shift_everyweek_uq')
			.on(t.shiftId)
			.where(sql`${t.weekOfMonth} is null`),

		// Enforce valid week range
		weekRange: check(
			'shift_recurrences_week_range_ck',
			sql`${t.weekOfMonth} is null or (${t.weekOfMonth} between 1 and 5)`
		),
	})
)

export const shiftAssignments = pgTable(
	'shift_assignments',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		shiftRecurrenceId: uuid('shift_recurrence_id')
			.notNull()
			.references(() => shiftRecurrences.id, { onDelete: 'cascade' }),

		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		// NEW: bucket/role within the shift
		assignmentRole: varchar('assignment_role', { length: 20 })
			.notNull()
			.default('worker'),
		// values: 'worker' | 'shift_lead' | 'trainer'

		// NEW: optional per-assignment note
		notes: varchar('notes', { length: 255 }),

		isPrimary: boolean('is_primary').notNull().default(true),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		recurrenceIdx: index('shift_assignments_recurrence_idx').on(
			t.shiftRecurrenceId
		),
		uniqUserPerRecurrence: uniqueIndex(
			'shift_assignments_user_recurrence_uq'
		).on(t.shiftRecurrenceId, t.userId),

		// Optional: enforce allowed roles at DB level
		roleCheck: check(
			'shift_assignments_role_ck',
			sql`${t.assignmentRole} in ('worker','shift_lead','trainer')`
		),
	})
)

export const shiftExceptions = pgTable('shift_exceptions', {
	id: uuid('id').defaultRandom().primaryKey(),

	shiftId: uuid('shift_id')
		.notNull()
		.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

	date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD

	// The worker who *actually* works that day (sub or extra helper)
	userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),

	overrideType: varchar('override_type', { length: 20 }).notNull(),
	// "remove" | "add" | "replace"

	// For substitute system:
	requestedBy: uuid('requested_by').references(() => user.id, {
		onDelete: 'set null',
	}),
	approvedBy: uuid('approved_by').references(() => user.id, {
		onDelete: 'set null',
	}),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
	// "pending" | "approved" | "denied" | "auto-approved"

	notes: varchar('notes', { length: 255 }),

	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const appSettings = pgTable(
	'app_settings',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// 🌍 Canonical center timezone (IANA)
		timeZone: varchar('time_zone', { length: 50 })
			.notNull()
			.default('America/Boise'),
		// examples:
		// 'America/Boise'
		// 'Europe/London'
		// 'America/Sao_Paulo'

		// --- Time & date formatting ---
		timeFormat: varchar('time_format', { length: 20 })
			.notNull()
			.default('h:mm a'),
		// Examples:
		// 'h:mm a'  → 4:00 PM
		// 'hh:mm a' → 04:00 PM
		// 'H:mm'    → 16:00
		// 'HH:mm'   → 16:00

		// --- Future-proof toggles ---
		use24HourClock: boolean('use_24_hour_clock').notNull().default(false),

		// 📅 Date formatting (future-proof)
		dateFormat: varchar('date_format', { length: 20 })
			.notNull()
			.default('MMM d, yyyy'),
		// examples:
		// 'MMM d, yyyy'
		// 'dd/MM/yyyy'
		// 'yyyy-MM-dd'

		assignedGenieGreenieMicroskillIds: jsonb(
			'assigned_genie_greenie_microskill_ids'
		)
			.$type<number[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),

		// --- Auditing ---
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		// Enforce allowed formats at DB level
		timeFormatCheck: check(
			'app_settings_time_format_ck',
			sql`${t.timeFormat} in ('h:mm a','hh:mm a','H:mm','HH:mm')`
		),
	})
)

export const center = pgTable(
	'center',
	{
		id: integer('id').primaryKey().default(1),

		name: varchar('name', { length: 120 }).notNull(),

		// 4 capital letters (e.g., "BFSC")
		abbreviation: varchar('abbreviation', { length: 4 }).notNull(),

		address: varchar('address', { length: 160 }).notNull(),
		city: varchar('city', { length: 80 }).notNull(),

		// Keep as text/varchar to support "ID", "UT", etc.
		state: varchar('state', { length: 2 }).notNull(),

		// Keep as string to preserve leading zeros
		zipcode: varchar('zipcode', { length: 10 }).notNull(),

		// ✅ store E.164, like "+12085551234"
		phoneNumber: varchar('phone_number', { length: 20 }).notNull(),

		// ✅ keep country so parsing/normalizing works globally
		phoneCountry: varchar('phone_country', { length: 2 })
			.notNull()
			.default('US'),

		primaryLanguage: varchar('primary_language', { length: 5 })
			.notNull()
			.default('en'),

		heroImageUrl: text('hero_image_url'),

		// Optional year (e.g., 1998)
		established: integer('established'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),

		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		abbrUq: uniqueIndex('center_abbreviation_uq').on(t.abbreviation),
		nameIdx: index('center_name_idx').on(t.name),

		abbrFormatCk: check(
			'center_abbreviation_format_ck',
			// exactly 4 uppercase letters
			sql`${t.abbreviation} ~ '^[A-Z]{4}$'`
		),

		stateFormatCk: check(
			'center_state_format_ck',
			// exactly 2 uppercase letters
			sql`${t.state} ~ '^[A-Z]{2}$'`
		),

		// ✅ E.164 basic check: + then 8–15 digits (E.164 max is 15 digits)
		phoneE164Ck: check(
			'center_phone_e164_ck',
			sql`${t.phoneNumber} ~ '^\\+[1-9][0-9]{7,14}$'`
		),

		// ✅ ISO-3166 alpha-2 check (simple)
		phoneCountryCk: check(
			'center_phone_country_ck',
			sql`${t.phoneCountry} ~ '^[A-Z]{2}$'`
		),

		establishedRangeCk: check(
			'center_established_range_ck',
			// allow null; otherwise a sane range
			sql`${t.established} is null or (${t.established} between 1700 and 2100)`
		),
	})
)
