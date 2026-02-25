// db/seeds/role-permissions.ts
import { db } from '@/db'
import { rolePermissions } from '@/db/schema/tables/permissions'

export async function seedRolePermissions() {
	await db.insert(rolePermissions).values([
		// Admin
		{ role: 'Admin', permission: 'users.view' },
		{ role: 'Admin', permission: 'users.edit' },
		{ role: 'Admin', permission: 'newsletters.create' },
		{ role: 'Admin', permission: 'newsletters.update' },
		{ role: 'Admin', permission: 'newsletters.delete' },
		{ role: 'Admin', permission: 'newsletters.publish' },
		{ role: 'Admin', permission: 'newsletters.view' },
		{ role: 'Admin', permission: 'shifts.edit' },
		{ role: 'Admin', permission: 'shifts.assign' },

		// Director
		{ role: 'Director', permission: 'users.view' },
		{ role: 'Director', permission: 'newsletters.create' },
		{ role: 'Director', permission: 'newsletters.update' },
		{ role: 'Director', permission: 'newsletters.delete' },
		{ role: 'Director', permission: 'newsletters.publish' },
		{ role: 'Director', permission: 'newsletters.view' },
		{ role: 'Director', permission: 'shifts.assign' },

		// Worker
		{ role: 'Worker', permission: 'shifts.view' },
	])
}
