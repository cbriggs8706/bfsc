import { notFound } from 'next/navigation'

import { PageBuilderForm } from '@/components/admin/pages/PageBuilderForm'
import { getCmsPageById } from '@/db/queries/cms'
import { requireRole } from '@/utils/require-role'

export default async function AdminCmsPageEdit({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	await requireRole(locale, ['Admin', 'Director', 'Assistant Director'], `/${locale}`)

	const page = await getCmsPageById(id, locale)
	if (!page) notFound()

	return (
		<PageBuilderForm
			mode="edit"
			locale={locale}
			pageId={page.id}
			initial={{
				id: page.id,
				locale: page.locale,
				title: page.title,
				slug: page.slug,
				menuLabel: page.menuLabel,
				iconName: page.iconName,
				excerpt: page.excerpt,
				seoTitle: page.seoTitle,
				seoDescription: page.seoDescription,
				isPublic: page.isPublic,
				allowedRoles: page.allowedRoles,
				showInMenu: page.showInMenu,
				menuTargets: page.menuTargets,
				ctaButtons: page.ctaButtons,
				maxWidth: page.maxWidth,
				heroStyle: page.heroStyle,
				backgroundStyle: page.backgroundStyle,
				sectionSpacing: page.sectionSpacing,
				showSectionNav: page.showSectionNav,
				sections: page.sections.map((section) => ({
					internalName: section.internalName,
					heading: section.heading,
					kind: section.kind,
					template: section.template,
					bodyHtml: section.bodyHtml,
					isVisible: section.isVisible,
				})),
			}}
		/>
	)
}
