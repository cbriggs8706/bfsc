// app/[locale]/admin/users/permissions/users/page.tsx
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { userPermissionGrants } from '@/db/schema/tables/permissions'
import { requireRole } from '@/utils/require-role'
import { UserPermissionSelector } from '@/components/admin/permissions/UserPermissionSelector'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function UserPermissionsPage({ params }: Props) {
	const { locale } = await params

	await requireRole(locale, ['Admin', 'Director'])

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		})
		.from(user)
		.orderBy(user.name)

	const grants = await db.select().from(userPermissionGrants)

	const grantsByUser: Record<string, typeof grants> = {}
	for (const g of grants) {
		if (!grantsByUser[g.userId]) grantsByUser[g.userId] = []
		grantsByUser[g.userId].push(g)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">User Permissions</h1>
				<p className="text-sm text-muted-foreground">
					Select a user to manage delegated permissions.
				</p>
			</div>
			<UserPermissionSelector
				users={users}
				grantsByUser={grantsByUser}
				locale={locale}
			/>
		</div>
	)
}
