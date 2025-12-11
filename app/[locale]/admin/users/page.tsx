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
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const session = await getServerSession(authOptions)
	const userRole = session?.user.role ?? 'Patron'
	const { locale } = await params

	if (!['Admin', 'Director', 'Assistant Director'].includes(userRole)) {
		return redirect(`/${locale}`)
	}

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			role: user.role,
		})
		.from(user)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">User Management</h1>
				{/* Placeholder if you later want "Create user" or filters */}
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
									<TableHead>Username</TableHead>
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
										<TableCell>{u.email}</TableCell>
										<TableCell>{u.username ?? '—'}</TableCell>
										<TableCell className="capitalize">{u.role}</TableCell>
										<TableCell className="text-right">
											<Link href={`/${locale}/admin/users/${u.id}/update`}>
												<Button size="sm" variant="outline">
													Edit
												</Button>
											</Link>
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
