// app/[locale]/admin/users/permissions/roles/page.tsx
import { db } from '@/db'
import { rolePermissions } from '@/db/schema/tables/permissions'
import { requireRole } from '@/utils/require-role'
import { RolePermissionEditor } from '@/components/admin/permissions/RolePermissionEditor'
import { roles } from '@/types/user'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function RolePermissionsPage({ params }: Props) {
	const { locale } = await params

	const viewer = await requireRole(locale, ['Admin', 'Director'])

	const rows = await db.select().from(rolePermissions)

	const byRole: Record<string, string[]> = {}

	for (const r of rows) {
		if (!byRole[r.role]) byRole[r.role] = []
		byRole[r.role].push(r.permission)
	}

	const visibleRoles =
		viewer.role === 'Admin' ? roles : roles.filter((r) => r !== 'Admin')

	return (
		<div className="p-6 space-y-6">
			<h1 className="text-3xl font-bold">Role Permissions</h1>

			{visibleRoles.map((role) => (
				<RolePermissionEditor
					key={role}
					role={role}
					initialPermissions={byRole[role] ?? []}
					locale={locale}
				/>
			))}
		</div>
	)
}
