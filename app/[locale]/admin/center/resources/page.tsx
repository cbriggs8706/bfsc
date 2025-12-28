// app/[locale]/admin/center/resources/page.tsx
import { readResources } from '@/lib/actions/resource/resource'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireRole } from '@/utils/require-role'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function ResourcePage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/memory-lane`
	)

	const resources = await readResources()
	const grouped = resources.reduce<Record<string, typeof resources>>(
		(acc, resource) => {
			;(acc[resource.type] ||= []).push(resource)
			return acc
		},
		{}
	)

	return (
		<div className="p-4 space-y-4">
			{/* Header — matches Library */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t('resource.titles')}</h1>
					<p className="text-sm text-muted-foreground">{t('resource.sub')}</p>
				</div>

				<Link href={`/${locale}/admin/center/resources/create`}>
					<Button variant="default">
						{t('create')} {t('resource.title')}
					</Button>
				</Link>
			</div>

			{/* Desktop filters placeholder (same spacing as Library) */}
			<div className="hidden md:block">{/* filters later */}</div>

			{/* Mobile filter drawer placeholder */}

			{/* Content */}
			<div className="">
				{resources.length === 0 ? (
					<div className="p-4 text-sm text-muted-foreground border rounded-md divide-y">
						{t('resource.noFound')}
					</div>
				) : (
					<div className="space-y-6">
						{Object.entries(grouped).map(([type, items]) => (
							<Card key={type} className="">
								{/* Section header */}
								<CardHeader className="">
									<h2 className="font-semibold">
										{t(`resource.typesP.${type}`)}
									</h2>
								</CardHeader>

								{/* Items */}
								<CardContent className="divide-y">
									{items.map((r) => (
										<div
											key={r.id}
											className="flex items-center justify-between p-4"
										>
											<div>
												<div className="font-medium">{r.name}</div>
												{/* <div className="text-xs text-muted-foreground">
													{r.description}
												</div> */}
											</div>

											<div className="flex gap-3 text-sm">
												<Link
													href={`/${locale}/admin/center/resources/${r.id}`}
												>
													<Button size="sm" variant="outline">
														{t('viewDetails')}
													</Button>
												</Link>

												<Link
													href={`/${locale}/admin/center/resources/update/${r.id}`}
												>
													<Button size="sm">{t('edit')}</Button>
												</Link>

												<Link
													href={`/${locale}/admin/center/resources/delete/${r.id}`}
												>
													<Button size="sm" variant="destructive">
														{t('delete')}
													</Button>
												</Link>
											</div>
										</div>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
