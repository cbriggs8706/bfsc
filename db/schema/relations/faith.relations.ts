// db/schema/relations/faith.relations.ts

import { relations } from 'drizzle-orm'
import { faiths, stakes, wards } from '../tables/faith'
import { kioskPeople } from '../tables/kiosk'

export const faithRelations = relations(faiths, ({ many }) => ({
	stakes: many(stakes),
	people: many(kioskPeople),
}))

export const stakeRelations = relations(stakes, ({ one, many }) => ({
	faith: one(faiths, {
		fields: [stakes.faithId],
		references: [faiths.id],
	}),
	wards: many(wards),
}))

export const wardRelations = relations(wards, ({ one, many }) => ({
	stake: one(stakes, {
		fields: [wards.stakeId],
		references: [stakes.id],
	}),
	people: many(kioskPeople),
}))
