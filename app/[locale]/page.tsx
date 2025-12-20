// app/[locale]/page.tsx
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { LANGUAGES } from '@/i18n/languages'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Page({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	redirect(`/${locale}/home`)
	const t = await getTranslations({ locale, namespace: 'common' })
	return (
		<div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,var(--green-accent),var(--background))] px-4">
			<div className="mx-auto flex w-full max-w-lg flex-col items-center rounded-2xl border border-border bg-card/90 p-8 shadow-sm backdrop-blur">
				<h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
					{t('welcomeBFSC')}
				</h1>
				<p className="text-sm text-muted-foreground mb-6">
					{t('construction')}
				</p>

				<div className="flex items-center gap-3 p-3 rounded-full bg-green-accent/70">
					<span className={`fi ${LANGUAGES[locale]?.flag ?? ''} text-xl`} />
					<LanguageSwitcher locale={locale} />
				</div>

				{/* You can uncomment these later; they’ll use your new primary/secondary */}
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Link href={`/${locale}/register`}>
						<Button>{t('register')}</Button>
					</Link>
					<Link href={`/${locale}/login`}>
						<Button variant="outline">{t('login')}</Button>
					</Link>
					<Link href={`/${locale}/course`}>
						<Button variant="secondary">{t('guest')}</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}
