// app/[locale]/admin/users/[id]/update/page.tsx

import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { UserForm } from '@/components/admin/user-form'

export default async function UserUpdatePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params

	const [u] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			role: user.role,
		})
		.from(user)
		.where(eq(user.id, id))

	if (!u) notFound()

	return (
		<div className="max-w-xl space-y-6">
			<h1 className="text-2xl font-bold">Edit User</h1>

			<Card>
				<CardHeader>
					<CardTitle>User details</CardTitle>
				</CardHeader>
				<CardContent>
					<UserForm locale={locale} user={u} />
				</CardContent>
			</Card>
		</div>
	)
}
