import { createElement } from 'react'
import Link from 'next/link'

import { listCmsPages } from '@/db/queries/cms'
import { requireRole } from '@/utils/require-role'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { resolveCmsMenuIcon } from '@/lib/cms-menu-icons'
import { getCmsAdminCopy } from '@/lib/cms-admin-copy'

export default async function AdminCmsPagesIndex({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = getCmsAdminCopy(locale)
	await requireRole(locale, ['Admin', 'Director', 'Assistant Director'], `/${locale}`)

	const pages = await listCmsPages(locale)

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold">{t.pageBuilder}</h1>
					<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
						{t.pageBuilderIntro}
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					{(['en', 'es', 'pt'] as const).map((targetLocale) => (
						<Button
							key={targetLocale}
							asChild
							variant={targetLocale === locale ? 'default' : 'outline'}
						>
							<Link href={`/${targetLocale}/admin/pages`}>
								{t.locales[targetLocale]}
							</Link>
						</Button>
					))}
					<Button asChild>
						<Link href={`/${locale}/admin/pages/create`}>{t.createPage}</Link>
					</Button>
				</div>
			</div>

			<div className="grid gap-4">
				{pages.length === 0 ? (
					<Card>
						<CardContent className="py-10 text-sm text-muted-foreground">
							{t.noPages}
						</CardContent>
					</Card>
				) : null}

				{pages.map((page) => (
					<Card key={page.id}>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div className="space-y-2">
								<CardTitle className="flex items-center gap-2">
									{createElement(resolveCmsMenuIcon(page.iconName), {
										className: 'size-5',
									})}
									<span>{page.title}</span>
								</CardTitle>
								<CardDescription>
									/{page.locale}/{page.slug}
								</CardDescription>
							</div>

							<div className="flex flex-wrap gap-2">
								<Badge variant={page.isPublic ? 'default' : 'secondary'}>
									{page.isPublic ? t.public : t.signedIn}
								</Badge>
								{page.showInMenu ? <Badge variant="outline">{t.inMenu}</Badge> : null}
								{page.allowedRoles.map((role) => (
									<Badge key={role} variant="secondary">
										{role}
									</Badge>
								))}
							</div>
						</CardHeader>

						<CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<p className="text-sm text-muted-foreground">
								{page.excerpt || t.noSummary}
							</p>

							<div className="flex gap-3">
								<Button asChild variant="outline">
									<Link href={`/${locale}/${page.slug}`} target="_blank">
										{t.preview}
									</Link>
								</Button>
								<Button asChild>
									<Link href={`/${locale}/admin/pages/${page.id}`}>{t.edit}</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
