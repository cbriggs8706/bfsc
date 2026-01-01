// db/schema/tables/resource.ts
import {
	pgTable,
	uuid,
	varchar,
	integer,
	boolean,
	timestamp,
	index,
	check,
	text,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { user } from './auth'
import { faiths, wards } from './faith'
import { weeklyShifts } from './shifts'

export const resources = pgTable(
	'resources',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 100 }).notNull(), // "VHS Digitization Station 1", "Recording Booth A"
		type: varchar('type', { length: 20 }).notNull(), // 'equipment' | 'room' | 'booth' | 'activity'
		defaultDurationMinutes: integer('default_duration_minutes').notNull(),
		capacity: integer('capacity'), // nullable
		maxConcurrent: integer('max_concurrent').notNull().default(1),
		isActive: boolean('is_active').notNull().default(true),
		description: text('description'),
		requiredItems: text('required_items'),
		prep: text('prep'),
		notes: text('notes'),
		link: text('link'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		typeIdx: index('resource_type_idx').on(t.type),
		typeCheck: check(
			'resource_type_ck',
			sql`${t.type} in ('equipment','room','booth', 'activity')`
		),
		capacityCheck: check(
			'resource_capacity_ck',
			sql`${t.capacity} is null or ${t.capacity} > 0`
		),
	})
)

export const reservations = pgTable(
	'reservations',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		resourceId: uuid('resource_id')
			.notNull()
			.references(() => resources.id, { onDelete: 'restrict' }),
		weeklyShiftId: uuid('weekly_shift_id')
			.notNull()
			.references(() => weeklyShifts.id),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		phone: text('phone').notNull(),
		locale: text('locale').notNull().default('en'),
		startTime: timestamp('start_time', { withTimezone: true }).notNull(),
		endTime: timestamp('end_time', { withTimezone: true }).notNull(),
		attendeeCount: integer('attendee_count').notNull().default(1),
		assistanceLevel: varchar('assistance_level', { length: 20 })
			.notNull()
			.default('none'),
		faithId: uuid('faith_id').references(() => faiths.id, {
			onDelete: 'set null',
		}),

		wardId: uuid('ward_id').references(() => wards.id, {
			onDelete: 'set null',
		}),

		isClosedDayRequest: boolean('is_closed_day_request')
			.notNull()
			.default(false),

		status: varchar('status', { length: 20 }).notNull().default('pending'),
		// 'pending' | 'confirmed' | 'denied' | 'cancelled'

		confirmedByUserId: uuid('confirmed_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),

		assignedWorkerId: uuid('assigned_worker_id').references(() => user.id, {
			onDelete: 'set null',
		}),

		notes: text('notes'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		resourceTimeIdx: index('reservation_resource_time_idx').on(
			t.resourceId,
			t.startTime,
			t.endTime
		),
		statusCheck: check(
			'reservation_status_ck',
			sql`${t.status} in ('pending','confirmed','denied','cancelled')`
		),
		assistanceCheck: check(
			'reservation_assistance_level_ck',
			sql`${t.assistanceLevel} in ('none','startup','full')`
		),
		attendeeCountCheck: check(
			'reservation_attendee_count_ck',
			sql`${t.attendeeCount} >= 1`
		),
		faithWardExclusiveCheck: check(
			'reservation_faith_xor_ward_ck',
			sql`
      (
        (${t.wardId} is not null and ${t.faithId} is null)
        or
        (${t.wardId} is null and ${t.faithId} is not null)
        or
        (${t.wardId} is null and ${t.faithId} is null)
      )
    `
		),
	})
)

export const resourceBlock = pgTable(
	'resource_block',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		resourceId: uuid('resource_id')
			.notNull()
			.references(() => resources.id, { onDelete: 'cascade' }),

		blockResourceId: uuid('block_resource_id')
			.notNull()
			.references(() => resources.id, { onDelete: 'cascade' }),
	},
	(t) => ({
		uniq: uniqueIndex('resource_block_unique_idx').on(
			t.resourceId,
			t.blockResourceId
		),
		selfBlockCheck: check(
			'resource_block_no_self_ck',
			sql`${t.resourceId} <> ${t.blockResourceId}`
		),
	})
)
