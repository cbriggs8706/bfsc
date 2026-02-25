// app/[locale]/(patron)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { announcement, db, kioskPeople, user as userTable } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { AnnouncementBanner } from '@/components/custom/AnnouncementBanner'
import { getUserCertificatesWithMissing } from '@/db/queries/training'
import { CertificatesGrid } from '@/components/training/CertificatesGrid'
import WorkerShiftsDashboard from '@/components/shifts/WorkerShifts'
import { getUpcomingShiftInstances } from '@/db/queries/shift-instances'
import { OpenRequestsSection } from '@/components/shifts/OpenRequestsSection'
import { getOpenSubstituteRequests } from '@/db/queries/shifts'
import { CurrentShiftPanel } from '@/components/shifts/CurrentShiftPanel'
import { ProjectCardGrid } from '@/components/admin/projects/ProjectCardGrid'
import { readProjectSummaries } from '@/lib/actions/projects/projects'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)
	const centerTime = await getCenterTimeConfig()

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

	const [accountUser] = await db
		.select({
			name: userTable.name,
			username: userTable.username,
			email: userTable.email,
		})
		.from(userTable)
		.where(eq(userTable.id, session.user.id))

	const [kioskProfile] = await db
		.select({
			profileImageUrl: kioskPeople.profileImageUrl,
			phone: kioskPeople.phone,
			passcode: kioskPeople.passcode,
			pid: kioskPeople.pid,
			faithId: kioskPeople.faithId,
			wardId: kioskPeople.wardId,
			languagesSpoken: kioskPeople.languagesSpoken,
			researchSpecialties: kioskPeople.researchSpecialties,
		})
		.from(kioskPeople)
		.where(eq(kioskPeople.userId, session.user.id))

	const profileCompletionFields = [
		{ label: 'Name', done: !!accountUser?.name?.trim() },
		{ label: 'Username', done: !!accountUser?.username?.trim() },
		{ label: 'Email', done: !!accountUser?.email?.trim() },
		{ label: 'Profile photo', done: !!kioskProfile?.profileImageUrl?.trim() },
		{ label: 'Phone number', done: !!kioskProfile?.phone?.trim() },
		{ label: 'Kiosk passcode', done: !!kioskProfile?.passcode?.trim() },
		{ label: 'PID', done: !!kioskProfile?.pid?.trim() },
		{ label: 'Faith', done: !!kioskProfile?.faithId },
		{ label: 'Ward', done: !!kioskProfile?.wardId },
		{
			label: 'Languages',
			done: (kioskProfile?.languagesSpoken?.length ?? 0) > 0,
		},
		{
			label: 'Research specialties',
			done: (kioskProfile?.researchSpecialties?.length ?? 0) > 0,
		},
	]

	const completedProfileFields = profileCompletionFields.filter(
		(field) => field.done
	).length
	const totalProfileFields = profileCompletionFields.length
	const profileCompletionPercent =
		totalProfileFields > 0
			? Math.round((completedProfileFields / totalProfileFields) * 100)
			: 0
	const showAccountCompletionCard = profileCompletionPercent < 100
	const missingProfileFields = profileCompletionFields
		.filter((field) => !field.done)
		.map((field) => field.label)

	const certificates = await getUserCertificatesWithMissing(session.user.id)
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
				<div
					className={`grid gap-6 lg:items-stretch ${
						showAccountCompletionCard ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
					}`}
				>
					{showAccountCompletionCard && (
						<div className="space-y-3 lg:col-span-1 lg:flex lg:flex-col">
							<h2 className="text-2xl font-semibold">Account Completion</h2>
							<Card className="border bg-card lg:flex-1">
								<CardContent className="p-5 md:p-6">
									<div className="flex flex-col items-center text-center">
										<ProgressCircle percent={profileCompletionPercent} />
										<div className="mt-4 space-y-1">
											<p className="text-sm text-muted-foreground">
												Keep your profile current for kiosk and worker tools.
											</p>
											<p className="text-sm text-muted-foreground">
												{completedProfileFields} of {totalProfileFields} fields
												completed.
											</p>
										</div>
										<Link href={`/${locale}/dashboard/account`}>
											<Button variant="secondary" className="mt-4">
												Update account
											</Button>
										</Link>
										{missingProfileFields.length > 0 && (
											<p className="mt-4 text-sm text-muted-foreground">
												Missing: {missingProfileFields.slice(0, 3).join(', ')}
												{missingProfileFields.length > 3 ? ', ...' : ''}
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					)}
					<div
						className={`${
							showAccountCompletionCard ? 'lg:col-span-2' : 'lg:col-span-1'
						} lg:flex lg:flex-col`}
					>
						<CertificatesGrid
							certificates={certificates}
							locale={locale}
							className="h-full lg:flex lg:flex-col"
							cardClassName="lg:flex-1"
							preferSingleRow={!showAccountCompletionCard}
						/>
					</div>
				</div>
				<CurrentShiftPanel
					title="Today in the Center"
					locale={locale}
					centerTime={centerTime}
				/>
				<h2 className="text-2xl font-semibold">Current Projects</h2>
				{/* TODO add a prop to determine how many ProjectCards to display */}
				<ProjectCardGrid projects={projects} locale={locale} />
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

function ProgressCircle({ percent }: { percent: number }) {
	const radius = 48
	const stroke = 12
	const size = 128
	const circumference = 2 * Math.PI * radius
	const offset = circumference - (percent / 100) * circumference

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0"
			role="img"
			aria-label={`Account completion ${percent}%`}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				className="stroke-muted-foreground/30"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="stroke-primary"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
			<text
				x="50%"
				y="50%"
				textAnchor="middle"
				dominantBaseline="central"
				className="fill-current text-20 font-medium"
			>
				{percent}%
			</text>
		</svg>
	)
}
