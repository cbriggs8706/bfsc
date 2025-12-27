// app/[locale]/admin/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { requireRole } from '@/utils/require-role'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}`
	)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Admin Dashboard</h1>
				<p className="text-sm text-muted-foreground">
					These features are only viewable and editable by Admin, Directors and
					Assistant Directors.
				</p>
			</div>

			<Card>
				<CardHeader>Admin Functions</CardHeader>
				<CardContent className="grid grid-cols-2 md:grid-cols-3 space-y-6">
					<Link href={`/${locale}/admin/users`}>
						<Button variant="default">Site Users</Button>
					</Link>
					<Link href={`/${locale}/admin/center`}>
						<Button variant="default">Center Definitions</Button>
					</Link>
					<Link href={`/${locale}/admin/center/special-hours`}>
						<Button variant="default">Center Closures</Button>
					</Link>
					<Link href={`/${locale}/shifts/assignments`}>
						<Button variant="default">Shift Assignments</Button>
					</Link>
					<Link href={`/${locale}/admin/Announcements`}>
						<Button variant="default">Announcements</Button>
					</Link>
					<Link href={`/${locale}/admin/newsletter`}>
						<Button variant="default">Newsletter</Button>
					</Link>
					<Link href={`/${locale}/library/create`}>
						<Button variant="default">Add Books for Checkout</Button>
					</Link>
					<Link href={`/${locale}/admin/center/resources`}>
						<Button variant="default">Resources & Activities</Button>
					</Link>
					<Link href={`/${locale}/admin/reservation`}>
						<Button variant="default">Reservations</Button>
					</Link>
					<Link href={`/${locale}/admin/training`}>
						<Button variant="default">Training Modules</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	)
}
