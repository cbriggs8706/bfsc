// db/schema/tables/notifications.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull(),
	type: text('type').notNull(),
	message: text('message').notNull(),
	readAt: timestamp('read_at'),
	createdAt: timestamp('created_at').defaultNow(),
})
