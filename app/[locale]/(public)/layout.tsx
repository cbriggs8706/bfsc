// app/[locale]/(public)/dashboard/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCmsMenuGroups } from '@/db/queries/cms'
import { AppFrame } from '@/components/nav/AppFrame'

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'Patron'
	const cmsMenuGroups = await getCmsMenuGroups(locale, role)

	return (
		<AppFrame
			session={session}
			role={role}
			locale={locale}
			cmsMenuGroups={cmsMenuGroups}
		>
			{children}
		</AppFrame>
	)
}
