// app/[locale]/admin/users/create/page.tsx
import { UserForm } from '@/components/admin/user/UserForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default async function CreateUserPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Create User</h1>
				<p className="text-sm text-muted-foreground">Lorem ipsum</p>
			</div>

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
