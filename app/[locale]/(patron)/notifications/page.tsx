// app/[locale]/(patron)/notifications/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserNotifications } from '@/db/queries/notifications'
import { Notifications } from '@/components/notifications/Notifications'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function NotificationsPage({ params }: Props) {
	const { locale } = await params

	const session = await getServerSession(authOptions)
	if (!session) redirect('/')
	const t = await getTranslations({ locale, namespace: 'common' })

	const notifications = await getUserNotifications(session.user.id)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('notifications')}</h1>
				<p className="text-sm text-muted-foreground">{t('notificationSub')}</p>
			</div>
			<Notifications notifications={notifications} />
		</div>
	)
}
