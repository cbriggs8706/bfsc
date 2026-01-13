// app/[locale]/admin/center/page.tsx

import { CenterProfileForm } from '@/components/admin/definitions/CenterProfileForm'
import { CenterTimeSettings } from '@/components/admin/definitions/CenterTimeSettings'
import { Button } from '@/components/ui/button'
import { getCenterProfile } from '@/lib/actions/center/center'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { requireRole } from '@/utils/require-role'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
type Props = {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: Props) {
	const { locale } = await params

	await requireRole(locale, ['Admin', 'Director'], `/${locale}/admin`)
	const t = await getTranslations({ locale })

	const centerTime = await getCenterTimeConfig()
	const center = await getCenterProfile() // loads id=1 or returns defaults

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{t('common.center.definitions')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('common.center.definitionSub')}
				</p>
			</div>

			{/* 🏢 Center Identity */}
			<CenterProfileForm initialCenter={center} />

			{/* ⏰ Time & Date */}
			<CenterTimeSettings
				initialTimeZone={centerTime.timeZone}
				initialTimeFormat={centerTime.timeFormat}
				initialDateFormat={centerTime.dateFormat}
			/>

			<div className="flex flex-wrap gap-4">
				<Link href={`/${locale}/admin/center/hours`}>
					<Button>{t('sidebar.admin.defineHours')}</Button>
				</Link>

				<Link href={`/${locale}/admin/center/shifts`}>
					<Button>{t('sidebar.admin.defineShifts')}</Button>
				</Link>

				<Link href={`/${locale}/admin/center/purposes`}>
					<Button>{t('sidebar.admin.definePurposes')}</Button>
				</Link>

				<Link href={`/${locale}/admin/center/case-types`}>
					<Button>{t('sidebar.admin.defineCaseTypes')}</Button>
				</Link>

				<Link href={`/${locale}/admin/center/faiths`}>
					<Button>{t('sidebar.admin.defineFaiths')}</Button>
				</Link>

				<Link href={`/${locale}/admin/center/faiths/callings`}>
					<Button>{t('sidebar.admin.defineCallings')}</Button>
				</Link>
			</div>
		</div>
	)
}
