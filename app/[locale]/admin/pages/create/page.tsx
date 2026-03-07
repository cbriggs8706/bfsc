import { PageBuilderForm } from '@/components/admin/pages/PageBuilderForm'
import { getCmsAdminCopy } from '@/lib/cms-admin-copy'
import { requireRole } from '@/utils/require-role'
import type { CmsPageInput } from '@/types/cms'

export default async function AdminCmsPageCreate({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = getCmsAdminCopy(locale)
	await requireRole(locale, ['Admin', 'Director', 'Assistant Director'], `/${locale}`)

	const initialPage: CmsPageInput = {
		locale,
		title: '',
		slug: '',
		menuLabel: '',
		iconName: 'Files',
		excerpt: '',
		seoTitle: '',
		seoDescription: '',
		isPublic: true,
		allowedRoles: [],
		showInMenu: true,
		menuTargets: ['main'],
		ctaButtons: [],
		maxWidth: 'standard',
		heroStyle: 'banner',
		backgroundStyle: 'subtle',
		sectionSpacing: 'comfortable',
		showSectionNav: false,
		sections: [
			{
				internalName: `${t.sectionNumber} 1`,
				heading: '',
				kind: 'richText',
				template: 'default',
				bodyHtml: '<p></p>',
				isVisible: true,
			},
		],
	}

	return (
		<PageBuilderForm mode="create" locale={locale} initial={initialPage} />
	)
}
