// app/[locale]/(patron)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { announcement, db } from '@/db'
import { sql } from 'drizzle-orm'
import { AnnouncementBanner } from '@/components/custom/AnnouncementBanner'
import { getUserCertificates } from '@/db/queries/training'
import { CertificatesGrid } from '@/components/training/CertificatesGrid'
import ConsultantShiftsDashboard from '@/components/shifts/ConsultantShifts'
import { getUpcomingShiftInstances } from '@/db/queries/shift-instances'

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

	const certificates = await getUserCertificates(session.user.id)
	const shiftInstances = await getUpcomingShiftInstances(session.user.id)

	return (
		<div className="p-4 space-y-4">
			{announcements.length > 0 && (
				<div className="space-y-3">
					{announcements.map((a) => (
						<AnnouncementBanner key={a.id} announcement={a} />
					))}
				</div>
			)}
			<div>
				<h1 className="text-3xl font-bold">
					{role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
				</h1>

				{/* 🎓 Certificates section */}
				<div className="space-y-3">
					<h2 className="text-xl font-semibold">Training Certificates</h2>
					<CertificatesGrid certificates={certificates} locale={locale} />
					<ConsultantShiftsDashboard
						shifts={shiftInstances}
						currentUserId={session.user.id}
						locale={locale}
					/>{' '}
				</div>
			</div>
		</div>
	)
}
