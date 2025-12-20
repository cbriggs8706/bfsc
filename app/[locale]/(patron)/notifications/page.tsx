// app/[locale]/(patron)/notifications/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserNotifications } from '@/db/queries/notifications'
import { Notifications } from '@/components/notifications/Notifications'

export default async function NotificationsPage() {
	const session = await getServerSession(authOptions)
	if (!session) redirect('/')

	const notifications = await getUserNotifications(session.user.id)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Notifications</h1>
				<p className="text-sm text-muted-foreground">
					Tap a notification to mark it as read.
				</p>
			</div>
			<Notifications notifications={notifications} />
		</div>
	)
}
