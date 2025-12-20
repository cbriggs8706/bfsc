// components/shifts/ConsultantShifts.tsx
'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import type { ShiftInstance } from '@/types/shifts'
import type { RequestDetail } from '@/types/substitutes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toAmPm } from '@/utils/time'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState } from 'react'

/* ======================================================
 * Types
 * ==================================================== */

type Props = {
	shifts: ShiftWithRequest[]
	currentUserId: string
	locale: string
}

type ShiftWithRequest = ShiftInstance & {
	subRequest?: RequestDetail | null
}

type MyShift = ShiftWithRequest & {
	isMine: boolean
	monthKey: string
}

type SubRequestUIState =
	| 'none'
	| 'open'
	| 'awaiting_request_confirmation'
	| 'awaiting_nomination_confirmation'
	| 'accepted'
	| 'cancelled'
	| 'expired'

/* ======================================================
 * Helpers
 * ==================================================== */

function getSubRequestUIState(
	request?: RequestDetail | null
): SubRequestUIState {
	if (!request) return 'none'

	switch (request.status) {
		case 'open':
			return 'open'
		case 'awaiting_request_confirmation':
			return 'awaiting_request_confirmation'
		case 'awaiting_nomination_confirmation':
			return 'awaiting_nomination_confirmation'
		case 'accepted':
			return 'accepted'
		case 'cancelled':
			return 'cancelled'
		case 'expired':
			return 'expired'
		default:
			return 'none'
	}
}

function SubstituteAction({
	shift,
	locale,
}: {
	shift: ShiftWithRequest
	locale: string
}) {
	const t = useTranslations('substitutes')
	const req = shift.subRequest
	const state = getSubRequestUIState(req)
	const [busy, setBusy] = useState(false)
	switch (state) {
		case 'none':
			return (
				<Button asChild size="sm">
					<Link
						href={`/${locale}/substitutes/request/create/${shift.date}/${shift.shiftRecurrenceId}`}
					>
						{t('findSubstitute')}
					</Link>
				</Button>
			)

		case 'open':
			return (
				<Button asChild size="sm">
					<Link href={`/${locale}/substitutes/request/${req?.id}`}>
						{t('viewRequest')}
					</Link>
				</Button>
			)

		case 'awaiting_request_confirmation': {
			return (
				<div className="flex flex-col items-end gap-1">
					<Link href={`/${locale}/substitutes/request/${req?.id}`}>
						<Button size="sm" variant="default">
							{t('waitingForYourResponse')}
						</Button>
					</Link>

					<span className="text-xs">{t('haveVolunteers')}</span>
				</div>
			)
		}
		case 'awaiting_nomination_confirmation': {
			return (
				<div className="flex flex-col items-end gap-1">
					<Button asChild size="sm">
						<Link href={`/${locale}/substitutes/request/${req?.id}`}>
							{t('viewRequest')}
						</Link>
					</Button>
					<span className="text-xs">{t('status.nominated')}</span>
				</div>
			)
		}

		case 'accepted':
			return (
				<div className="flex flex-col items-end gap-1">
					<Button asChild size="sm">
						<Link href={`/${locale}/substitutes/request/${req?.id}`}>
							{t('viewRequest')}
						</Link>
					</Button>
					<div className="flex items-center gap-2 text-xs font-medium">
						{/* {req?.acceptedBy && (
							<Avatar className="h-5 w-5">
								{req?.acceptedBy && (
									<Avatar className="h-5 w-5">
										<AvatarImage
											src={req.acceptedBy.imageUrl ?? undefined}
											alt={req.acceptedBy.name}
										/>
										<AvatarFallback className="text-[10px]">
											{initials(req.acceptedBy.name)}
										</AvatarFallback>
									</Avatar>
								)}
							</Avatar>
						)} */}

						{req?.acceptedBy
							? t('confirmedBy', { name: req.acceptedBy.name })
							: t('substituteConfirmed')}
					</div>

					{/* {req && (
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="px-0 h-auto text-xs"
						>
							<Link href={`/${locale}/substitutes/request/${req.id}`}>
								{t('viewDetails')}
							</Link>
						</Button>
					)} */}
				</div>
			)

		case 'cancelled':
		case 'expired':
			return (
				<div className="flex flex-col items-end gap-1">
					<Button
						size="sm"
						variant="secondary"
						disabled={busy}
						onClick={async () => {
							if (!req) return
							setBusy(true)
							await import('@/app/actions/substitute/reopen-request').then(
								({ reopenSubRequest }) => reopenSubRequest(req.id)
							)
							location.reload()
						}}
					>
						{t('requestAgain')}
					</Button>
					<span className="text-xs">{t(`status.${state}`)}</span>
				</div>
			)
	}
}

/* ======================================================
 * Component
 * ==================================================== */

export default function ConsultantShiftsDashboard({
	shifts,
	currentUserId,
	locale,
}: Props) {
	const t = useTranslations('substitutes')

	const mine: MyShift[] = shifts
		.map((s) => ({
			...s,
			isMine: s.assignedUserIds.includes(currentUserId),
			monthKey: format(parseISO(s.date), 'yyyy-MM'),
		}))
		.filter((s) => s.isMine)

	if (mine.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">
				{t('noUpcomingShifts')}
			</div>
		)
	}

	const byMonth = mine.reduce<Record<string, MyShift[]>>((acc, shift) => {
		acc[shift.monthKey] ??= []
		acc[shift.monthKey].push(shift)
		return acc
	}, {})

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{t('myUpcomingShifts')}</h1>
				<Link href={`/${locale}/substitutes/calendar`}>
					<Button variant="default">{t('viewAllSubstituteRequests')}</Button>
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{Object.entries(byMonth)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([monthKey, shifts]) => {
						const monthLabel = format(parseISO(`${monthKey}-01`), 'MMMM yyyy')

						return (
							<Card key={monthKey}>
								<CardHeader className="pb-2">
									<CardTitle className="text-base">{monthLabel}</CardTitle>
								</CardHeader>

								<CardContent className="space-y-2">
									{shifts.map((shift) => (
										<div
											key={`${shift.shiftId}-${shift.date}`}
											className="flex items-center justify-between gap-3"
										>
											<div className="min-w-0">
												<div className="font-medium">
													{format(parseISO(shift.date), 'EEE MMM d')} ·{' '}
													{toAmPm(shift.startTime)}–{toAmPm(shift.endTime)}
												</div>

												{shift.isException && (
													<div className="text-xs text-muted-foreground">
														Exception applied ({shift.exceptionType})
														{/* {t('exceptionApplied', { type: shift.exceptionType })} */}
													</div>
												)}
											</div>

											<SubstituteAction shift={shift} locale={locale} />
										</div>
									))}
								</CardContent>
							</Card>
						)
					})}
			</div>
		</div>
	)
}
