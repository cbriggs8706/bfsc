// db/schema/relations/reservation.relations.ts

import { relations } from 'drizzle-orm'
import { reservation, resource } from '../tables/resource'
import { user } from '../tables/auth'

export const reservationRelations = relations(reservation, ({ one }) => ({
	user: one(user, {
		fields: [reservation.userId],
		references: [user.id],
	}),

	resource: one(resource, {
		fields: [reservation.resourceId],
		references: [resource.id],
	}),
}))

export const resourceRelations = relations(resource, ({ many }) => ({
	reservations: many(reservation),
}))
