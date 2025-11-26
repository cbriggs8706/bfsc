// app/[locale]/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const role = session.user.role ?? 'user'

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">
				{role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
			</h1>

			{/* <JoinCourseModal locale={locale} /> */}
			<h2 className="text-2xl font-bold">My Enrolled Courses</h2>
		</div>
	)
}
