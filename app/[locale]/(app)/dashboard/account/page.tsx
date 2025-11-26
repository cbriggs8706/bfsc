// app/[locale]/(app)/dashboard/account/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import UserDetails from '@/components/auth/user-details'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	// const userId = session?.user.id
	if (!session) redirect(`/${locale}`)

	return (
		<div className="space-y-6">
			<UserDetails />
		</div>
	)
}
