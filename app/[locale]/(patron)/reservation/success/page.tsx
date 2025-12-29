// app/[locale]/(patron)/reservation/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) {
		redirect(`/${locale}/login?redirect=/${locale}/reservation`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">
					{t('reservation.requestSuccess')}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('reservation.requestSuccessSub')}
				</p>
			</div>
			<Link href={`/${locale}/reservation`}>
				<Button>Create another reservation</Button>
			</Link>
		</div>
	)
}
