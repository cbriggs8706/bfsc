// db/schema/tables/faith.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'

export const faiths = pgTable('faiths', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	address: text('address'),
	city: text('city'),
})

export const stakes = pgTable('stakes', {
	id: uuid('id').defaultRandom().primaryKey(),
	faithId: uuid('faith_id')
		.notNull()
		.references(() => faiths.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
})

export const wards = pgTable('wards', {
	id: uuid('id').defaultRandom().primaryKey(),
	stakeId: uuid('stake_id')
		.notNull()
		.references(() => stakes.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
})

export const positions = pgTable('positions', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
})
