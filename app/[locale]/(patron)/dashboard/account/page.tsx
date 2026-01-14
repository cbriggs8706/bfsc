// app/[locale]/(patron)/dashboard/account/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import UserDetails from '@/components/auth/AuthUserDetails'
import { getCenterProfile } from '@/lib/actions/center/center'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })
	const center = await getCenterProfile()

	const session = await getServerSession(authOptions)
	// const userId = session?.user.id
	if (!session) redirect(`/${locale}`)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('userAccount')}</h1>
				<p className="text-sm text-muted-foreground">{t('userSub')}</p>
			</div>
			<UserDetails countryCode={center.phoneCountry} />
		</div>
	)
}
