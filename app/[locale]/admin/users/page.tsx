// app/[locale]/admin/users/page.tsx
import Link from 'next/link'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { sql } from 'drizzle-orm'
import { requireRole } from '@/utils/require-role'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const userRole = session?.user.role

	// if (!['Admin', 'Director', 'Assistant Director'].includes(userRole)) {
	// 	return redirect(`/${locale}`)
	// }

	// TODO new access pattern
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			role: user.role,
		})
		.from(user)
		.orderBy(
			sql`
			CASE ${user.role}
				WHEN 'Admin' THEN 1
				WHEN 'Director' THEN 2
				WHEN 'Assistant Director' THEN 3
				WHEN 'Shift Lead' THEN 4
				WHEN 'Worker' THEN 5
				WHEN 'Patron' THEN 7
				ELSE 8
			END
		`,
			sql`COALESCE(${user.name}, ${user.email}) ASC`
		)

	function canEditUser(viewerRole?: string, targetRole?: string) {
		if (!viewerRole || !targetRole) return false

		switch (viewerRole) {
			case 'Admin':
				return [
					'Admin',
					'Director',
					'Assistant Director',
					'Shift Lead',
					'Worker',
					'Patron',
				].includes(targetRole)

			case 'Director':
				return !['Admin'].includes(targetRole)

			case 'Assistant Director':
				return !['Admin', 'Director', 'Assistant Director'].includes(targetRole)

			default:
				return false
		}
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Manage Users</h1>
				<p className="text-sm text-muted-foreground">
					Use this judiciously! Any changes to an email address or username can
					lock someone out of their account. Any changes to a role will require
					them to logout and back in for those changes to take effect.
				</p>
			</div>

			<Card>
				<CardHeader className="flex items-center justify-end mb-4">
					<Link href={`/${locale}/admin/users/create`}>
						<Button>Add User</Button>
					</Link>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className="w-[120px] text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((u) => (
									<TableRow key={u.id}>
										<TableCell>{u.name ?? '—'}</TableCell>
										<TableCell className="">{u.email}</TableCell>
										<TableCell className="capitalize">{u.role}</TableCell>
										<TableCell className="text-right">
											{canEditUser(userRole, u.role) ? (
												<Link href={`/${locale}/admin/users/${u.id}/update`}>
													<Button size="sm" variant="outline">
														Edit
													</Button>
												</Link>
											) : (
												<Button size="sm" variant="outline" disabled>
													Edit
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}

								{users.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className="text-center text-sm">
											No users found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
