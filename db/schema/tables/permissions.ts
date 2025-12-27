// db/schema/tables/permissions.ts
import { pgTable, uuid, text, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const rolePermissions = pgTable(
	'role_permissions',
	{
		role: text('role').notNull(), // matches user.role
		permission: text('permission').notNull(),
	},
	(t) => ({
		pk: primaryKey(t.role, t.permission),
	})
)

export const userPermissionGrants = pgTable('user_permission_grants', {
	id: uuid('id').defaultRandom().primaryKey(),

	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	permission: text('permission').notNull(),

	grantedByUserId: uuid('granted_by_user_id').references(() => user.id),

	startsAt: timestamp('starts_at', { withTimezone: true })
		.notNull()
		.defaultNow(),

	endsAt: timestamp('ends_at', { withTimezone: true }),

	notes: text('notes'),
})
