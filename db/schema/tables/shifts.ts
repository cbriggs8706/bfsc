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
} from 'drizzle-orm/pg-core'
import { user } from './auth' // your existing user table
import { sql } from 'drizzle-orm'

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
