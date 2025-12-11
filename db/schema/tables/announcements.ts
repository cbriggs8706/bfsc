import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	jsonb,
} from 'drizzle-orm/pg-core'

export const announcement = pgTable('announcement', {
	id: uuid('id').defaultRandom().primaryKey(),

	title: varchar('title', { length: 255 }).notNull(),
	body: text('body').notNull(),

	roles: jsonb('roles').$type<string[]>().notNull(),
	imageUrl: varchar('image_url', { length: 500 }),

	expiresAt: timestamp('expires_at', { mode: 'date' }),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export type Announcement = typeof announcement.$inferSelect
