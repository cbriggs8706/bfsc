// app/[locale]/admin/center/page.tsx

import { CenterTimeSettings } from '@/components/admin/definitions/CenterTimeSettings'
import { Button } from '@/components/ui/button'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { requireRole } from '@/utils/require-role'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

type Props = {
	params: Promise<{ locale: string }>
}

// export const metadata: Metadata = {
// 	title: 'Manage Center Definitions',
// }

export default async function Page({ params }: Props) {
	const { locale } = await params

	await requireRole(locale, ['Admin', 'Director'], `/${locale}/admin`)
	const t = await getTranslations({ locale })

	const centerTime = await getCenterTimeConfig()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('common.center.definitions')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('common.center.definitionSub')}
				</p>
			</div>

			<CenterTimeSettings
				initialTimeZone={centerTime.timeZone}
				initialTimeFormat={centerTime.timeFormat}
				initialDateFormat={centerTime.dateFormat}
			/>
			<ul className="space-y-4">
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/hours`}>
						<Button>{t('sidebar.admin.defineHours')}</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/shifts`}>
						<Button>{t('sidebar.admin.defineShifts')}</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/purposes`}>
						<Button>{t('sidebar.admin.definePurposes')}</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/case-types`}>
						<Button>{t('sidebar.admin.defineCaseTypes')}</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/faiths`}>
						<Button>{t('sidebar.admin.defineFaiths')}</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/faiths/callings`}>
						<Button>{t('sidebar.admin.defineCallings')}</Button>
					</Link>
				</li>
			</ul>
		</div>
	)
}
