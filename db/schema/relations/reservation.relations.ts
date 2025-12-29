// db/schema/relations/reservation.relations.ts

import { relations } from 'drizzle-orm'
import { reservations, resources } from '../tables/resources'
import { user } from '../tables/auth'

export const reservationRelations = relations(reservations, ({ one }) => ({
	user: one(user, {
		fields: [reservations.userId],
		references: [user.id],
	}),

	resource: one(resources, {
		fields: [reservations.resourceId],
		references: [resources.id],
	}),
}))

export const resourceRelations = relations(resources, ({ many }) => ({
	reservations: many(reservations),
}))
