// db/schema/tables/classes.ts
import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	integer,
	index,
	uniqueIndex,
	jsonb,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

// --------------------
// SERIES
// --------------------
export const classSeries = pgTable(
	'class_series',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		createdByUserId: uuid('created_by_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),

		// draft | published
		status: varchar('status', { length: 16 }).notNull().default('draft'),

		approvedByUserId: uuid('approved_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		approvedAt: timestamp('approved_at', { withTimezone: true }),

		title: varchar('title', { length: 200 }).notNull(),
		description: text('description'),

		location: varchar('location', { length: 200 }).notNull(),

		zoomUrl: text('zoom_url'),
		recordingUrl: text('recording_url'),

		coverImagePath: text('cover_image_path'),
		coverImageUrl: text('cover_image_url'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		statusIdx: index('class_series_status_idx').on(t.status),
		createdByIdx: index('class_series_created_by_idx').on(t.createdByUserId),
	})
)

// --------------------
// SERIES PRESENTERS (M:N)
// --------------------
export const classSeriesPresenter = pgTable(
	'class_series_presenter',
	{
		seriesId: uuid('series_id')
			.notNull()
			.references(() => classSeries.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(t) => ({
		pk: uniqueIndex('class_series_presenter_pk').on(t.seriesId, t.userId),
	})
)

// --------------------
// SERIES LINKS
// --------------------
export const classSeriesLink = pgTable(
	'class_series_link',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		seriesId: uuid('series_id')
			.notNull()
			.references(() => classSeries.id, { onDelete: 'cascade' }),

		label: varchar('label', { length: 120 }).notNull(),
		url: text('url').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		seriesIdx: index('class_series_link_series_idx').on(t.seriesId),
	})
)

// --------------------
// SESSIONS / PARTS
// --------------------
export const classSession = pgTable(
	'class_session',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		seriesId: uuid('series_id')
			.notNull()
			.references(() => classSeries.id, { onDelete: 'cascade' }),

		partNumber: integer('part_number').notNull(), // 1..N

		// UTC stored in timestamptz
		startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
		durationMinutes: integer('duration_minutes').notNull(),

		// scheduled | canceled
		status: varchar('status', { length: 16 }).notNull().default('scheduled'),
		canceledReason: text('canceled_reason'),

		// Overrides (null => inherit series)
		titleOverride: varchar('title_override', { length: 200 }),
		descriptionOverride: text('description_override'),
		locationOverride: varchar('location_override', { length: 200 }),

		zoomUrlOverride: text('zoom_url_override'),
		recordingUrlOverride: text('recording_url_override'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		seriesIdx: index('class_session_series_idx').on(t.seriesId),
		startIdx: index('class_session_starts_at_idx').on(t.startsAt),
		seriesPartUq: uniqueIndex('class_session_series_part_uq').on(
			t.seriesId,
			t.partNumber
		),
	})
)

// --------------------
// SESSION PRESENTERS (M:N)
// If none exist => inherit from series presenters
// --------------------
export const classSessionPresenter = pgTable(
	'class_session_presenter',
	{
		sessionId: uuid('session_id')
			.notNull()
			.references(() => classSession.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(t) => ({
		pk: uniqueIndex('class_session_presenter_pk').on(t.sessionId, t.userId),
	})
)

// --------------------
// SESSION LINKS (override)
// If none exist => inherit from series links
// --------------------
export const classSessionLink = pgTable(
	'class_session_link',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sessionId: uuid('session_id')
			.notNull()
			.references(() => classSession.id, { onDelete: 'cascade' }),

		label: varchar('label', { length: 120 }).notNull(),
		url: text('url').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		sessionIdx: index('class_session_link_session_idx').on(t.sessionId),
	})
)

// --------------------
// HANDOUTS (PDF) per session
// --------------------
export const classSessionHandout = pgTable(
	'class_session_handout',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sessionId: uuid('session_id')
			.notNull()
			.references(() => classSession.id, { onDelete: 'cascade' }),

		fileName: varchar('file_name', { length: 255 }).notNull(),
		filePath: text('file_path').notNull(),
		publicUrl: text('public_url'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		sessionIdx: index('class_session_handout_session_idx').on(t.sessionId),
	})
)

export const siteSetting = pgTable('site_setting', {
	key: varchar('key', { length: 64 }).primaryKey(),
	value: jsonb('value').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})
// key: "classes.requireApproval" value: true/false
