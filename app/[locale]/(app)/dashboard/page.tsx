// app/[locale]/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { announcement, db } from '@/db'
import { sql } from 'drizzle-orm'
import { AnnouncementBanner } from '@/components/custom/AnnouncementBanner'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const role = session.user.role ?? 'Patron'

	// Fetch announcements visible to the user role and not expired
	const announcements = await db
		.select()
		.from(announcement)
		.where(
			sql`${announcement.roles} @> ${JSON.stringify([role])} 
			AND (${announcement.expiresAt} IS NULL 
				OR ${announcement.expiresAt} > NOW())`
		)
		.orderBy(announcement.createdAt)

	return (
		<div className="space-y-6">
			{announcements.length > 0 && (
				<div className="space-y-3">
					{announcements.map((a) => (
						<AnnouncementBanner key={a.id} announcement={a} />
					))}
				</div>
			)}
			<h1 className="text-3xl font-bold">
				{role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
			</h1>

			{/* <JoinCourseModal locale={locale} /> */}
			<h2 className="text-2xl font-bold">My Enrolled Courses</h2>
		</div>
	)
}
