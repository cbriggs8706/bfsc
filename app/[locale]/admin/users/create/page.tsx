// app/[locale]/admin/users/create/page.tsx
import { UserForm } from '@/components/admin/user-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default async function CreateUserPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params

	return (
		<div className="max-w-xl space-y-6">
			<h1 className="text-2xl font-bold">Create User</h1>

			<Card>
				<CardHeader>
					<CardTitle>New user details</CardTitle>
				</CardHeader>
				<CardContent>
					<UserForm locale={locale} />
				</CardContent>
			</Card>
		</div>
	)
}
