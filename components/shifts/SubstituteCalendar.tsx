// components/shifts/SubstituteCalendar.tsx
'use client'

import Link from 'next/link'
import {
	parseISO,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	format,
	isSameMonth,
	isToday,
	addMonths,
	subMonths,
} from 'date-fns'
import { CalendarRequest } from '@/types/substitutes'
import { toAmPm } from '@/utils/time'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '../ui/card'

type Props = {
	requests: CalendarRequest[]
	nominations: CalendarRequest[]
	acceptedRequests: CalendarRequest[]
	currentUserId: string | null
	locale: string
}

function groupRequestsByDate(requests: CalendarRequest[]) {
	const map = new Map<string, CalendarRequest[]>()

	for (const r of requests) {
		const day = r.date // YYYY-MM-DD
		if (!map.has(day)) map.set(day, [])
		map.get(day)!.push(r)
	}

	return map
}

export function SubstituteCalendarClient({
	requests,
	nominations,
	acceptedRequests,
	currentUserId,
	locale,
}: Props) {
	const t = useTranslations('substitutes')
	const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()))

	function initials(name: string) {
		const parts = name.trim().split(/\s+/)
		const first = parts[0]?.[0] ?? ''
		const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
		return (first + last).toUpperCase() || '?'
	}

	function isMine(r: CalendarRequest) {
		return !!currentUserId && r.requestedBy.userId === currentUserId
	}

	// ✅ CORRECTLY derived from server boolean
	const waitingForAcceptance = requests.filter((r) => r.hasVolunteeredByMe)

	const openRequests = requests.filter((r) => !r.hasVolunteeredByMe)

	const openByDay = groupRequestsByDate(openRequests)

	return (
		<div className="space-y-8">
			{/* ================= Accepted ================= */}
			{acceptedRequests.length > 0 && (
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold">{t('substituteConfirmed')}</h2>

					<ul className="space-y-2">
						{acceptedRequests.map((r) => (
							<li
								key={r.id}
								className="flex items-center justify-between border rounded p-3 bg-green-50 border-green-300"
							>
								<div>
									<div className="font-medium">
										{format(parseISO(r.date), 'EEE MMM d')} ·{' '}
										{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
									</div>

									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Avatar className="h-5 w-5">
											<AvatarImage src={r.requestedBy.imageUrl ?? undefined} />
											<AvatarFallback className="text-[10px]">
												{initials(r.requestedBy.name)}
											</AvatarFallback>
										</Avatar>

										<span>
											{t('requestedBy')}{' '}
											<span className="font-medium">{r.requestedBy.name}</span>
										</span>
									</div>
								</div>

								<Link
									href={`/${locale}/substitutes/request/${r.id}`}
									className="text-sm underline text-green-700"
								>
									{t('viewDetails')}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* ================= Nominated ================= */}
			{nominations.length > 0 && (
				<div className="border rounded p-4 bg-yellow-50 space-y-2">
					<h2 className="font-semibold text-yellow-800">
						{t('nominatedTitle')}
					</h2>

					<ul className="space-y-2">
						{nominations.map((r) => (
							<li
								key={r.id}
								className="flex items-center justify-between border rounded p-3 bg-yellow-100 border-yellow-300"
							>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<span>{t('requestedBy')}</span>

									<HoverCard>
										<HoverCardTrigger asChild>
											<span className="underline decoration-dotted cursor-help">
												{r.requestedBy.name}
											</span>
										</HoverCardTrigger>
										<HoverCardContent className="w-64">
											<div className="flex items-center gap-3">
												<Avatar className="h-6 w-6">
													<AvatarFallback className="text-[10px]">
														{initials(r.requestedBy.name)}
													</AvatarFallback>
												</Avatar>

												<div>
													<div className="font-medium">
														{r.requestedBy.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{format(parseISO(r.date), 'MMMM d, yyyy')} ·{' '}
														{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
													</div>
												</div>
											</div>
										</HoverCardContent>
									</HoverCard>
								</div>

								<Link
									href={`/${locale}/substitutes/request/${r.id}`}
									className="text-sm underline font-medium text-yellow-700"
								>
									{t('respond')}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* ================= Waiting for Acceptance ================= */}
			{waitingForAcceptance.length > 0 && (
				<div className="border rounded p-4 bg-blue-50 space-y-2">
					<h2 className="font-semibold text-blue-800">
						{t('waitingForRequesterTitle')}
					</h2>

					<ul className="space-y-2">
						{waitingForAcceptance.map((r) => (
							<li
								key={r.id}
								className="flex items-center justify-between border rounded p-3 bg-blue-100 border-blue-300"
							>
								<div>
									<div className="font-medium">
										{format(parseISO(r.date), 'EEE MMM d')} ·{' '}
										{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
									</div>

									<div className="text-sm text-muted-foreground">
										{t('waitingForRequester')}
									</div>
								</div>

								<Link
									href={`/${locale}/substitutes/request/${r.id}`}
									className="text-sm underline text-blue-700"
								>
									{t('viewDetails')}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* ================= Open Requests ================= */}
			<h2 className="text-2xl font-semibold">{t('openRequests')}</h2>

			{openRequests.length === 0 ? (
				<div className="text-sm text-muted-foreground">
					{t('openRequestsEmpty')}
				</div>
			) : (
				<Card className="p-6">
					<MonthCalendar
						month={activeMonth}
						onPrev={() => setActiveMonth((m) => subMonths(m, 1))}
						onNext={() => setActiveMonth((m) => addMonths(m, 1))}
						requestsByDay={openByDay}
						locale={locale}
					/>
				</Card>
			)}

			{openRequests.length === 0 ? (
				<div className="text-sm text-muted-foreground">
					{t('openRequestsEmpty')}
				</div>
			) : (
				<ul className="space-y-2">
					{openRequests.map((r) => (
						<li
							key={r.id}
							className={
								`flex items-center justify-between border rounded p-3 ` +
								(isMine(r) ? 'bg-primary/5 border-primary/30' : '')
							}
						>
							<div>
								<div className="font-medium">
									{format(parseISO(r.date), 'EEE MMM d')} ·{' '}
									{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
								</div>

								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Avatar className="h-5 w-5">
										<AvatarImage src={r.requestedBy.imageUrl ?? undefined} />
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

									{isMine(r) && (
										<Badge variant="secondary">{t('requestedByYou')}</Badge>
									)}
								</div>
							</div>

							<Link
								href={`/${locale}/substitutes/request/${r.id}`}
								className="text-sm underline"
							>
								{t('view')}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

type MonthCalendarProps = {
	month: Date
	onPrev: () => void
	onNext: () => void
	requestsByDay: Map<string, CalendarRequest[]>
	locale: string
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/)
	return ((parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? '')).toUpperCase()
}

export function MonthCalendar({
	month,
	onPrev,
	onNext,
	requestsByDay,
	locale,
}: MonthCalendarProps) {
	const start = startOfWeek(startOfMonth(month))
	const end = endOfWeek(endOfMonth(month))

	const days: Date[] = []
	for (let d = start; d <= end; d = addDays(d, 1)) {
		days.push(d)
	}

	return (
		<div className="space-y-3">
			{/* ===== Header ===== */}
			<div className="flex items-center justify-between">
				<Button size="sm" variant="outline" onClick={onPrev}>
					←
				</Button>

				<h3 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h3>

				<Button size="sm" variant="outline" onClick={onNext}>
					→
				</Button>
			</div>

			{/* ===== Calendar Grid ===== */}
			<div className="grid grid-cols-7 gap-px bg-white rounded overflow-hidden">
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
					<div
						key={d}
						className="bg-(--green-logo) text-xs font-medium p-2 text-center"
					>
						{d}
					</div>
				))}

				{days.map((day) => {
					const key = format(day, 'yyyy-MM-dd')
					const requests = requestsByDay.get(key) ?? []
					const inMonth = isSameMonth(day, month)

					return (
						<div
							key={key}
							className={[
								'min-h-[110px] bg-(--green-logo-soft) p-2 text-sm',
								!inMonth && 'opacity-40',
								isToday(day) && 'ring-1 ring-primary',
							].join(' ')}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-medium">{format(day, 'd')}</span>

								{requests.length > 0 && (
									<Badge variant="default" className="text-[10px]">
										{requests.length}
									</Badge>
								)}
							</div>

							<div className="space-y-1">
								{requests.map((r) => (
									<HoverCard key={r.id}>
										<HoverCardTrigger asChild>
											<Link
												href={`/${locale}/substitutes/request/${r.id}`}
												className="block truncate rounded bg-(--blue-accent) px-1 py-0.5 text-[11px] hover:bg-primary/20"
											>
												{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
											</Link>
										</HoverCardTrigger>

										<HoverCardContent className="w-64">
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={r.requestedBy.imageUrl ?? undefined}
													/>
													<AvatarFallback className="text-xs">
														{initials(r.requestedBy.name)}
													</AvatarFallback>
												</Avatar>

												<div className="min-w-0">
													<div className="font-medium truncate">
														{r.requestedBy.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{format(parseISO(r.date), 'EEEE, MMM d')}
													</div>
													<div className="text-xs text-muted-foreground">
														{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
													</div>
												</div>
											</div>
										</HoverCardContent>
									</HoverCard>
								))}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
