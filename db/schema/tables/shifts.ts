// db/schema/tables/shifts.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	boolean,
	integer,
} from 'drizzle-orm/pg-core'
import { user } from './auth' // your existing user table

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

export const weeklyShifts = pgTable('weekly_shifts', {
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
})

export const shiftAssignments = pgTable('shift_assignments', {
	id: uuid('id').defaultRandom().primaryKey(),

	shiftId: uuid('shift_id')
		.notNull()
		.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	// Mark the main scheduled worker (as opposed to a substitute)
	isPrimary: boolean('is_primary').notNull().default(true),

	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

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
