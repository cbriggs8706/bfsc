'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toAmPm } from '@/utils/time'
import type { CalendarRequest } from '@/types/substitutes'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type Props = {
	openRequests: CalendarRequest[]
	currentUserId: string
	locale: string
	collapsible?: boolean
	defaultCollapsed?: boolean
}

export function OpenRequestsSection({
	openRequests,
	currentUserId,
	locale,
	collapsible = false,
	defaultCollapsed = false,
}: Props) {
	const t = useTranslations('substitutes')
	const [collapsed, setCollapsed] = useState(
		collapsible ? defaultCollapsed : false
	)
	const isMine = (r: CalendarRequest) => r.requestedBy.userId === currentUserId

	const initials = (name?: string | null) =>
		name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase() ?? '?'

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">{t('openRequests')}</h2>

				{collapsible && (
					<Button
						variant="default"
						size="sm"
						onClick={() => setCollapsed((v) => !v)}
						className="flex items-center gap-2"
					>
						<Badge variant="destructive">{openRequests.length}</Badge>
						<span className="text-sm">{collapsed ? t('show') : t('hide')}</span>
					</Button>
				)}
			</div>

			{(!collapsible || !collapsed) && (
				<>
					{openRequests.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t('openRequestsEmpty')}
						</p>
					) : (
						<>
							<ul className="space-y-2">
								{openRequests.map((r) => (
									<li
										key={r.id}
										className={`flex items-center justify-between border rounded p-3 ${
											isMine(r)
												? 'bg-card/50'
												: 'bg-(--blue-accent-soft) border-(--blue-accent)'
										}`}
									>
										<div>
											<div className="font-medium">
												{format(parseISO(r.date), 'EEE MMM d')} ·{' '}
												{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
											</div>

											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={r.requestedBy.imageUrl ?? undefined}
													/>
													<AvatarFallback className="text-[10px]">
														{initials(r.requestedBy.name)}
													</AvatarFallback>
												</Avatar>

												<span>
													{t('requestedBy')}{' '}
													<span className="font-medium">
														{r.requestedBy.name || t('unknownUser')}
													</span>
												</span>

												{/* {isMine(r) && (
											<Badge variant="secondary">{t('requestedByYou')}</Badge>
										)} */}
											</div>
										</div>

										<Link href={`/${locale}/substitutes/request/${r.id}`}>
											<Button size="sm">{t('viewDetails')}</Button>
										</Link>
									</li>
								))}
							</ul>
						</>
					)}
				</>
			)}
		</div>
	)
}
