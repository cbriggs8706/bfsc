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
import WorkerShiftsDashboard from '@/components/shifts/WorkerShifts'
import { getUpcomingShiftInstances } from '@/db/queries/shift-instances'
import { OpenRequestsSection } from '@/components/shifts/OpenRequestsSection'
import { getOpenSubstituteRequests } from '@/db/queries/shifts'
import { CurrentShiftPanel } from '@/components/shifts/CurrentShiftPanel'
import { ProjectCardGrid } from '@/components/admin/projects/ProjectCardGrid'
import { readProjectSummaries } from '@/lib/actions/projects/projects'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const role = session.user.role ?? 'Patron'
	const user = session.user.id
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
	const requests = user ? await getOpenSubstituteRequests(user) : []
	const openRequests = requests.filter((r) => !r.hasVolunteeredByMe)
	const projects = await readProjectSummaries()

	return (
		<div className="p-4 space-y-4">
			<div className="space-y-8">
				<h1 className="text-3xl font-bold">{t('dashboard')}</h1>
				{announcements.length > 0 && (
					<div className="space-y-3 mt-4">
						{announcements.map((a) => (
							<AnnouncementBanner key={a.id} announcement={a} />
						))}
					</div>
				)}
				<CurrentShiftPanel locale={locale} />
				<h2 className="text-2xl font-semibold">Current Projects</h2>
				{/* TODO add a prop to determine how many ProjectCards to display */}
				<ProjectCardGrid projects={projects} locale={locale} />
				<CertificatesGrid certificates={certificates} locale={locale} />
				<OpenRequestsSection
					openRequests={openRequests}
					currentUserId={session.user.id}
					locale={locale}
					collapsible={true}
					defaultCollapsed={true}
				/>
				<WorkerShiftsDashboard
					shifts={shiftInstances}
					currentUserId={session.user.id}
					locale={locale}
				/>{' '}
			</div>
		</div>
	)
}
