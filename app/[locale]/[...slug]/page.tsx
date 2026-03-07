import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'

import { CmsPageRenderer } from '@/components/cms/CmsPageRenderer'
import { AppFrame } from '@/components/nav/AppFrame'
import { authOptions } from '@/lib/auth'
import { getCmsMenuGroups, getCmsPageBySlug } from '@/db/queries/cms'

type Props = {
	params: Promise<{ locale: string; slug: string[] }>
}

async function loadPage(locale: string, slug: string[]) {
	return getCmsPageBySlug(locale, slug.join('/'))
}

function canViewPage(
	page: NonNullable<Awaited<ReturnType<typeof loadPage>>>,
	role: string
) {
	return page.isPublic || page.allowedRoles.includes(role as never)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, slug } = await params
	const page = await loadPage(locale, slug)
	if (!page) return {}

	return {
		title: page.seoTitle || page.title,
		description: page.seoDescription || page.excerpt || undefined,
	}
}

export default async function CmsPageRoute({ params }: Props) {
	const { locale, slug } = await params
	const page = await loadPage(locale, slug)
	if (!page) notFound()

	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'Patron'
	const currentPath = `/${locale}/${slug.join('/')}`

	if (!page.isPublic && !session) {
		redirect(`/${locale}/login?redirect=${encodeURIComponent(currentPath)}`)
	}

	if (!canViewPage(page, role)) {
		redirect(`/${locale}`)
	}

	const cmsMenuGroups = await getCmsMenuGroups(locale, role)

	return (
		<AppFrame
			session={session}
			role={role}
			locale={locale}
			cmsMenuGroups={cmsMenuGroups}
		>
			<CmsPageRenderer page={page} />
		</AppFrame>
	)
}
