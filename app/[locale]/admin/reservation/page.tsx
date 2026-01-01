// app/[locale]/admin/reservation/page.tsx
import { readReservations } from '@/lib/actions/resource/reservation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getAppSettings } from '@/lib/actions/app-settings'
import { formatTimeRange, toHHMM } from '@/utils/time'
import { format } from 'date-fns'
import { requireRole } from '@/utils/require-role'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function ReservationsPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director', 'Shift Lead'],
		`/${locale}/dashboard`
	)

	const reservations = await readReservations()

	// group by status (mirrors resource.type grouping)
	const grouped = reservations.reduce<Record<string, typeof reservations>>(
		(acc, r) => {
			;(acc[r.status] ||= []).push(r)
			return acc
		},
		{}
	)

	const settings = await getAppSettings()
	const timeFormat = settings.timeFormat

	return (
		<div className="p-4 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t('reservation.titles')}</h1>
					<p className="text-sm text-muted-foreground">
						{t('reservation.sub')}
					</p>
				</div>

				<Link href={`/${locale}/admin/reservation/create`}>
					<Button>
						{t('create')} {t('reservation.title')}
					</Button>
				</Link>
			</div>

			{/* Desktop filters placeholder */}
			<div className="hidden md:block">{/* filters later */}</div>

			{/* Content */}
			<div>
				{reservations.length === 0 ? (
					<div className="p-4 text-sm text-muted-foreground border rounded-md">
						{t('reservation.noneFound')}
					</div>
				) : (
					<div className="space-y-6">
						{Object.entries(grouped).map(([status, items]) => (
							<Card key={status}>
								<CardHeader>
									<h2 className="font-semibold">
										{t(`reservation.statuses.${status}`)}
									</h2>
								</CardHeader>

								<CardContent className="divide-y">
									{items.map((r) => {
										return (
											<div
												key={r.id}
												className="flex items-center justify-between p-4"
											>
												<div className="space-y-0.5">
													<div className="font-medium">
														{r.user?.name ||
															r.user?.email ||
															t('reservation.title')}
													</div>

													<div className="text-base text-muted-foreground">
														{format(new Date(r.startTime), 'MMM d, yyyy')} ·{' '}
														{formatTimeRange(
															toHHMM(new Date(r.startTime)),
															toHHMM(new Date(r.endTime)),
															timeFormat
														)}
													</div>
													<div>{r.resource.name}</div>
													<div className="text-sm text-muted-foreground">
														{r.notes}
													</div>
												</div>

												<div className="flex gap-3 text-sm">
													<Link href={`/${locale}/admin/reservation/${r.id}`}>
														<Button size="sm" variant="outline">
															{t('viewDetails')}
														</Button>
													</Link>

													<Link
														href={`/${locale}/admin/reservation/update/${r.id}`}
													>
														<Button size="sm">{t('edit')}</Button>
													</Link>

													<Link
														href={`/${locale}/admin/reservation/delete/${r.id}`}
													>
														<Button size="sm" variant="destructive">
															{t('delete')}
														</Button>
													</Link>
												</div>
											</div>
										)
									})}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
