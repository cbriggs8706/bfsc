// db/schema/relations/permissions.ts
import { relations } from 'drizzle-orm'
import { rolePermissions, userPermissionGrants } from '../tables/permissions'
import { user } from '../tables/auth'

export const rolePermissionsRelations = relations(rolePermissions, ({}) => ({}))

export const userPermissionGrantsRelations = relations(
	userPermissionGrants,
	({ one }) => ({
		user: one(user, {
			fields: [userPermissionGrants.userId],
			references: [user.id],
		}),
		grantedBy: one(user, {
			fields: [userPermissionGrants.grantedByUserId],
			references: [user.id],
		}),
	})
)
