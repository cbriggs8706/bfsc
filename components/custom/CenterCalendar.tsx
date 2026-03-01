//components/custom/CenterCalendar.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	addDays,
	addMonths,
	addWeeks,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
	subWeeks,
	eachDayOfInterval,
} from 'date-fns'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

import {
	ChevronLeft,
	ChevronRight,
	CalendarDays,
	CalendarRange,
	Calendar as CalendarIcon,
} from 'lucide-react'

import { toAmPm, formatLongDate, formatInTz } from '@/utils/time'
import { formatHourShort } from '@/lib/date'
import { getDayInfo } from '@/lib/calendar/day-info'
import Link from 'next/link'

//CORRECTED TIMEZONE

/* ============================
   TYPES
============================ */

type Special = {
	id: string
	date: string // yyyy-mm-dd
	isClosed: boolean
	opensAt: string | null
	closesAt: string | null
	reason?: string | null
}

type Weekly = {
	weekday: number // 0–6
	opensAt: string
	closesAt: string
	isClosed: boolean
}

type CalendarClass = {
	id: string
	date: string // yyyy-mm-dd (LOCAL)
	startsAtIso: string
	endsAtIso?: string
	title: string
	location: string
	description: string | null
	descriptionOverride: string | null
	isCanceled: boolean
	presenters: string[]
	kind: 'class' | 'reservation' | 'group-visit'
	reservationStatus?: 'pending' | 'confirmed'
}

type CalendarView = 'month' | 'week' | 'day'

/* ============================
   SMALL HELPERS
============================ */

function ymd(date: Date) {
	return format(date, 'yyyy-MM-dd')
}

function formatCompactTimeRange(
	startIso: string,
	endIso: string,
	timeZone: string
) {
	const start = new Date(startIso)
	const end = new Date(endIso)

	const startTime = formatInTz(start, timeZone, 'h:mm')
	const endTime = formatInTz(end, timeZone, 'h:mm')
	const startMeridiem = formatInTz(start, timeZone, 'a').toLowerCase()
	const endMeridiem = formatInTz(end, timeZone, 'a').toLowerCase()

	if (startMeridiem === endMeridiem) {
		return `${startTime}-${endTime}${endMeridiem}`
	}

	return `${startTime}${startMeridiem}-${endTime}${endMeridiem}`
}

function minutesSinceMidnightInCenter(iso: string, timeZone: string) {
	const [hh, mm] = formatInTz(new Date(iso), timeZone, 'HH:mm')
		.split(':')
		.map(Number)

	return hh * 60 + mm
}

// For week/day time grid sizing
const START_HOUR = 6
const END_HOUR = 21
const MINUTES_PER_PIXEL = 2 // 2 min per px => 60 min = 30px
const EVENT_DEFAULT_MINUTES = 60

const EVENT_COLORS = [
	'bg-blue-100 text-blue-900 border-blue-200',
	'bg-emerald-100 text-emerald-900 border-emerald-200',
	'bg-amber-100 text-amber-900 border-amber-200',
	'bg-violet-100 text-violet-900 border-violet-200',
	// 'bg-rose-100 text-rose-900 border-rose-200',
	'bg-sky-100 text-sky-900 border-sky-200',
	'bg-stone-100 text-stone-900 border-stone-200',
]

const RESERVATION_CONFIRMED_COLOR =
	'bg-(--blue-accent-soft) text-(--accent-foreground) border-(--blue-accent)'
const RESERVATION_PENDING_COLOR =
	'bg-(--gray-accent-soft) text-(--gray-accent) border-(--gray-accent) border-dotted border-2'
const GROUP_VISIT_COLOR =
	'bg-(--green-logo-soft) text-(--foreground) border-(--green-logo)'

/* ============================
   COMPONENT
============================ */

export default function CenterCalendar({
	specials,
	weekly,
	classes,
	initialYear,
	initialMonth,
	locale,
	centerTime,
}: {
	specials: Special[]
	weekly: Weekly[]
	classes: CalendarClass[]
	initialYear: number
	initialMonth: number
	locale: string
	centerTime: {
		timeZone: string
	}
}) {
	const isMobile = useIsMobile()

	const [view, setView] = useState<CalendarView>('month')
	const [viewDate, setViewDate] = useState(
		new Date(initialYear, initialMonth, 1)
	)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)

	// Mobile default: day view
	useEffect(() => {
		if (!isMobile) return

		setView('day')
		setViewDate(startOfDay(new Date()))
	}, [isMobile])

	/* ============================
	   MAPS
	============================ */

	const classesByDate = useMemo(() => {
		const m = new Map<string, CalendarClass[]>()
		for (const c of classes) {
			const arr = m.get(c.date) ?? []
			arr.push(c)
			arr.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
			m.set(c.date, arr)
		}
		return m
	}, [classes])

	const classColorMap = useMemo(() => {
		const map = new Map<string, string>()

		// 1. Collect unique series (use title for now)
		const uniqueSeries = Array.from(
			new Set(classes.filter((c) => c.kind === 'class').map((c) => c.title))
		)

		// 2. Assign colors in order, cycling only after exhaustion
		uniqueSeries.forEach((title, index) => {
			const color = EVENT_COLORS[index % EVENT_COLORS.length]
			map.set(title, color)
		})

		return map
	}, [classes])

	function getEventColorClasses(event: CalendarClass) {
		if (event.kind === 'reservation') {
			return event.reservationStatus === 'pending'
				? RESERVATION_PENDING_COLOR
				: RESERVATION_CONFIRMED_COLOR
		}
		if (event.kind === 'group-visit') {
			return GROUP_VISIT_COLOR
		}

		return classColorMap.get(event.title) ?? EVENT_COLORS[0]
	}

	/* ============================
	   DAY INFO
	============================ */

	function getDayColorClasses(info: ReturnType<typeof getDayInfo>) {
		// Closed with an explicit reason (true closure)
		if (info.isClosed && info.reason) {
			return {
				bg: 'bg-(--red-accent-soft)',
				dot: 'bg-(--red-accent)',
			}
		}

		// Closed but no reason → appointment only
		if (info.isClosed && !info.reason) {
			return {
				bg: 'bg-neutral-100',
				dot: 'bg-neutral-400',
			}
		}

		// Open
		return {
			bg: 'bg-(--green-logo-soft)',
			dot: 'bg-(--green-logo)',
		}
	}

	/* ============================
	   NAVIGATION
	============================ */

	const goToday = () => {
		const t = new Date()

		if (view === 'month') {
			setViewDate(startOfMonth(t))
			setSelectedDate(t)
			return
		}

		if (view === 'week') {
			setViewDate(startOfWeek(t, { weekStartsOn: 0 }))
			setSelectedDate(t)
			return
		}

		// day view
		setViewDate(startOfDay(t))
		setSelectedDate(t)
	}

	const setViewToToday = (nextView: CalendarView) => {
		const t = new Date()

		setView(nextView)

		if (nextView === 'month') {
			setViewDate(startOfMonth(t))
			setSelectedDate(t)
			return
		}

		if (nextView === 'week') {
			setViewDate(startOfWeek(t, { weekStartsOn: 0 }))
			setSelectedDate(t)
			return
		}

		// day
		setViewDate(startOfDay(t))
		setSelectedDate(t)
	}

	const goPrev = () => {
		setSelectedDate(null)
		setViewDate((d) => {
			if (view === 'month') return subMonths(d, 1)
			if (view === 'week') return subWeeks(d, 1)
			return subDays(d, 1)
		})
	}

	const goNext = () => {
		setSelectedDate(null)
		setViewDate((d) => {
			if (view === 'month') return addMonths(d, 1)
			if (view === 'week') return addWeeks(d, 1)
			return addDays(d, 1)
		})
	}

	const headerLabel = useMemo(() => {
		if (view === 'month') return format(viewDate, 'MMMM yyyy')
		if (view === 'week') {
			const ws = startOfWeek(viewDate, { weekStartsOn: 0 })
			const we = endOfWeek(viewDate, { weekStartsOn: 0 })
			return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
		}
		return format(viewDate, 'MMMM d, yyyy')
	}, [view, viewDate])

	/* ============================
	   DAY DETAILS (you already had this, kept)
	============================ */

	const renderClassesList = (dayClasses: CalendarClass[]) => {
		if (dayClasses.length === 0) return null

		return (
			<div className="mt-4 space-y-2">
				<h3 className="font-semibold">Events</h3>
				<ul className="space-y-2">
					{dayClasses.map((c) => {
						const startTime = toAmPm(
							formatInTz(new Date(c.startsAtIso), centerTime.timeZone, 'HH:mm')
						)
						const timeLabel =
							c.kind === 'reservation' && c.endsAtIso
								? formatCompactTimeRange(
										c.startsAtIso,
										c.endsAtIso,
										centerTime.timeZone
								  )
								: startTime

						return (
							<li
								key={c.id}
								className={cn(
									'border rounded px-1 text-[11px] truncate',
									getEventColorClasses(c),
									c.isCanceled && 'line-through opacity-70'
								)}
							>
								<div className="text-base mb-2">
									{timeLabel} — {c.title}
								</div>

								{c.kind !== 'reservation' && (
									<div className="text-base ">
										Location: {c.location}
										{c.isCanceled && ' (Canceled)'}
									</div>
								)}
								{c.kind === 'reservation' &&
									c.reservationStatus === 'pending' && (
										<div className="text-base ">(Pending)</div>
									)}

								{c.presenters.length > 0 && (
									<div className="text-base ">
										Presenter{c.presenters.length > 1 ? 's' : ''}:{' '}
										{c.presenters.join(', ')}
									</div>
								)}
								{c.description && (
									<div className="text-base text-wrap">
										Description:{c.description}
									</div>
								)}
								{c.descriptionOverride && (
									<div className="text-base text-wrap">
										{c.descriptionOverride}
									</div>
								)}
							</li>
						)
					})}
				</ul>
			</div>
		)
	}

	const DayDetails = ({ date }: { date: Date }) => {
		const info = getDayInfo(date, specials, weekly)
		const key = ymd(date)
		const dayClasses = classesByDate.get(key) ?? []

		if (info.source === 'special' && info.isClosed) {
			return (
				<>
					<p className="text-red-600 font-semibold">
						{info.reason ? `Closed for ${info.reason}` : 'Closed'}
					</p>
					{renderClassesList(dayClasses)}
				</>
			)
		}

		if (info.isClosed) {
			return (
				<>
					<p className="text-neutral-700 font-semibold mb-4">
						Open By Appointment Only
					</p>
					<p className="text-neutral-700 mb-4 text-wrap">
						Reservations outside of regular hours require us to find 2 staff
						volunteers to assist, which we will be happy to do for groups of 5
						or more.
					</p>
					<Link href={`/${locale}/reservation`}>
						<Button>Make an appointment</Button>
					</Link>
					{renderClassesList(dayClasses)}
				</>
			)
		}

		return (
			<>
				<p>
					Open: {toAmPm(info.opensAt)} <br />
					Close: {toAmPm(info.closesAt)}
				</p>
				{renderClassesList(dayClasses)}
			</>
		)
	}

	function isHourOpen(info: ReturnType<typeof getDayInfo>, hour: number) {
		if (info.isClosed) return false
		if (!info.opensAt || !info.closesAt) return false

		const [openH] = info.opensAt.split(':').map(Number)
		const [closeH] = info.closesAt.split(':').map(Number)

		return hour >= openH && hour < closeH
	}

	type PositionedEvent = CalendarClass & {
		top: number
		height: number
		columnIndex: number
		columnCount: number
	}

	function layoutDayEvents(events: CalendarClass[]): PositionedEvent[] {
		// Convert to positioned events
		const positioned = events.map((c) => {
			const top = eventTopPx(c.startsAtIso)
			const height = eventHeightPx()

			return {
				...c,
				top,
				height,
				columnIndex: 0,
				columnCount: 1,
			}
		})

		// Sort by start time
		positioned.sort((a, b) => a.top - b.top)

		// Group overlapping events
		const groups: PositionedEvent[][] = []

		for (const ev of positioned) {
			let placed = false

			for (const group of groups) {
				const overlaps = group.some(
					(g) => ev.top < g.top + g.height && ev.top + ev.height > g.top
				)

				if (overlaps) {
					group.push(ev)
					placed = true
					break
				}
			}

			if (!placed) {
				groups.push([ev])
			}
		}

		// Assign columns within each group
		for (const group of groups) {
			group.forEach((ev, index) => {
				ev.columnIndex = index
				ev.columnCount = group.length
			})
		}

		return positioned
	}

	/* ============================
	   MONTH VIEW
	============================ */

	const MonthView = () => {
		const monthStart = startOfMonth(viewDate)
		const monthEnd = endOfMonth(viewDate)
		const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
		const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
		const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

		const dayHeaders = isMobile
			? ['Su', 'M', 'T', 'W', 'R', 'F', 'Sa']
			: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

		return (
			<div className="rounded-md border overflow-hidden bg-background">
				<div className="grid grid-cols-7 border-b">
					{dayHeaders.map((d) => (
						<div
							key={d}
							className="p-2 text-xs font-medium text-muted-foreground"
						>
							{d}
						</div>
					))}
				</div>

				<div className="grid grid-cols-7">
					{days.map((d) => {
						const key = ymd(d)
						const dayClasses = classesByDate.get(key) ?? []
						const info = getDayInfo(d, specials, weekly)
						const inMonth = isSameMonth(d, viewDate)
						const colors = getDayColorClasses(info)

						return (
							<button
								key={key}
								onClick={() => setSelectedDate(d)}
								className={cn(
									'relative border p-1 text-left flex flex-col gap-1 transition',
									isMobile ? 'h-20' : 'h-28',
									inMonth ? colors.bg : 'bg-neutral-200 text-muted-foreground',
									'hover:bg-card',
									isToday(d) && 'ring-2 ring-primary ring-inset'
								)}
							>
								<div className="flex items-center justify-between">
									<div className="text-xs font-semibold">{format(d, 'd')}</div>

									{/* subtle “Closed” dot */}
									{inMonth && (
										<span
											className={cn(
												'h-2 w-2 rounded-full',
												getDayColorClasses(info).dot
											)}
										/>
									)}
								</div>

								<div className="flex flex-col gap-0.5 overflow-hidden">
									{dayClasses.slice(0, isMobile ? 2 : 3).map((c) => {
										const time = toAmPm(
											formatInTz(
												new Date(c.startsAtIso),
												centerTime.timeZone,
												'HH:mm'
											)
										)

										return (
											<div
												key={c.id}
												className={cn(
													'border rounded px-1 text-[11px] truncate',
													getEventColorClasses(c),
													c.isCanceled && 'line-through opacity-70'
												)}
												title={`${time} — ${c.title}`}
											>
												<span className="font-medium">{time}</span>{' '}
												<span className="opacity-90">{c.title}</span>
											</div>
										)
									})}

									{dayClasses.length > (isMobile ? 2 : 3) && (
										<div className="text-[10px] text-muted-foreground ">
											+{dayClasses.length - (isMobile ? 2 : 3)} more
										</div>
									)}
								</div>
							</button>
						)
					})}
				</div>
			</div>
		)
	}

	/* ============================
	   WEEK / DAY VIEW (TIME GRID)
	   - time-of-day positioning
	   - week: horizontal scroll + drag
	============================ */

	const hours = useMemo(() => {
		const arr: number[] = []
		for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h)
		return arr
	}, [])

	const gridHeightPx = ((END_HOUR - START_HOUR) * 60) / MINUTES_PER_PIXEL

	function eventTopPx(iso: string) {
		const minutes =
			minutesSinceMidnightInCenter(iso, centerTime.timeZone) - START_HOUR * 60

		return Math.max(0, minutes / MINUTES_PER_PIXEL)
	}

	function eventHeightPx() {
		return EVENT_DEFAULT_MINUTES / MINUTES_PER_PIXEL
	}

	const WeekView = () => {
		const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
		const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 })
		const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

		// drag-to-scroll
		const headerScrollRef = useRef<HTMLDivElement | null>(null)
		const bodyScrollRef = useRef<HTMLDivElement | null>(null)
		const drag = useRef<{ down: boolean; x: number; left: number }>({
			down: false,
			x: 0,
			left: 0,
		})

		const syncScroll = () => {
			if (!headerScrollRef.current || !bodyScrollRef.current) return
			headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft
		}

		const onMouseDown = (e: React.MouseEvent) => {
			if (!bodyScrollRef.current) return
			drag.current.down = true
			drag.current.x = e.pageX
			drag.current.left = bodyScrollRef.current.scrollLeft
		}
		const onMouseLeave = () => (drag.current.down = false)
		const onMouseUp = () => (drag.current.down = false)
		const onMouseMove = (e: React.MouseEvent) => {
			if (!drag.current.down || !bodyScrollRef.current) return
			const dx = e.pageX - drag.current.x
			bodyScrollRef.current.scrollLeft = drag.current.left - dx
			syncScroll()
		}

		return (
			<div className="rounded-md border bg-card overflow-hidden">
				{/* header row */}
				<div className="grid grid-cols-[56px_1fr] border-b bg-primary/70">
					<div className="p-3 text-xs font-medium ">Time</div>

					<div ref={headerScrollRef} className="overflow-x-hidden">
						<div
							className="grid"
							style={{ gridTemplateColumns: `repeat(7, minmax(160px, 1fr))` }}
						>
							{days.map((d) => {
								const info = getDayInfo(d, specials, weekly)
								const colors = getDayColorClasses(info)

								return (
									<button
										key={ymd(d)}
										onClick={() => setSelectedDate(d)}
										className={cn(
											'border-l px-2 py-1 text-left transition',
											colors.bg,
											'hover:bg-card',
											isToday(d) && 'ring-2 ring-primary ring-inset'
										)}
									>
										<div className="flex items-center justify-between">
											<div className="leading-tight">
												<div className="text-[11px] uppercase tracking-wide text-muted-foreground">
													{format(d, isMobile ? 'EEE' : 'EEEE')}
												</div>
												<div className="text-sm font-semibold">
													{format(d, 'MMM d')}
												</div>
											</div>

											<span
												className={cn(
													'h-2 w-2 rounded-full shrink-0',
													colors.dot
												)}
											/>
										</div>
									</button>
								)
							})}
						</div>
					</div>
				</div>

				{/* grid body */}
				<div className="grid grid-cols-[56px_1fr]">
					{/* left time axis */}
					<div className="relative border-r">
						<div style={{ height: gridHeightPx }} className="relative">
							{hours.map((h) => (
								<div
									key={h}
									className="absolute left-0 w-full text-[10px] text-muted-foreground"
									style={{
										top: ((h - START_HOUR) * 60) / MINUTES_PER_PIXEL - 6,
									}}
								>
									<div className="px-4 py-3">{formatHourShort(h)}</div>
								</div>
							))}
						</div>
					</div>

					{/* day columns scroller */}
					<div
						ref={bodyScrollRef}
						onScroll={syncScroll}
						className="overflow-x-auto overscroll-x-contain"
						onMouseDown={onMouseDown}
						onMouseLeave={onMouseLeave}
						onMouseUp={onMouseUp}
						onMouseMove={onMouseMove}
					>
						<div
							className="grid"
							style={{ gridTemplateColumns: `repeat(7, minmax(160px, 1fr))` }}
						>
							{days.map((d) => {
								const key = ymd(d)
								const dayClasses = classesByDate.get(key) ?? []

								return (
									<div
										key={key}
										className={cn('relative border-l')}
										style={{ height: gridHeightPx }}
										onClick={() => setSelectedDate(d)}
									>
										{/* hour lines */}
										{hours.map((h) => {
											const info = getDayInfo(d, specials, weekly)
											const open = isHourOpen(info, h)

											return (
												<div
													key={h}
													className={cn(
														// TODO fix colors day rows

														'absolute left-0 right-0 border-t bg-neutral-100',
														open && 'bg-(--green-logo)/60'
													)}
													style={{
														top: ((h - START_HOUR) * 60) / MINUTES_PER_PIXEL,
														height: 60 / MINUTES_PER_PIXEL,
													}}
												/>
											)
										})}

										{/* events */}
										{dayClasses.map((c) => {
											const start = new Date(c.startsAtIso)
											const top = eventTopPx(c.startsAtIso)
											const height = eventHeightPx()
											const time = toAmPm(
												formatInTz(
													new Date(start),
													centerTime.timeZone,
													'HH:mm'
												)
											)

											// Hide events outside our visible window
											const minutes =
												minutesSinceMidnightInCenter(
													c.startsAtIso,
													centerTime.timeZone
												) -
												START_HOUR * 60

											if (
												minutes < 0 ||
												minutes > (END_HOUR - START_HOUR) * 60
											) {
												return null
											}

											return (
												<button
													key={c.id}
													onClick={(e) => {
														e.stopPropagation()
														setSelectedDate(d)
													}}
													className={cn(
														'absolute left-1 right-1 rounded border px-2 py-1 text-left text-[11px] overflow-hidden',
														getEventColorClasses(c),
														c.isCanceled && 'line-through opacity-70'
													)}
													style={{ top, height }}
													title={`${time} — ${c.title}`}
												>
													<div className=" truncate">
														<span className="font-semibold">{time}</span>{' '}
														{c.title}
													</div>
												</button>
											)
										})}
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const DayView = () => {
		// In day view, "viewDate" is the day being shown
		const day = startOfDay(viewDate)
		const key = ymd(day)
		const dayClasses = classesByDate.get(key) ?? []
		const info = getDayInfo(day, specials, weekly)
		const positionedEvents = layoutDayEvents(dayClasses)

		return (
			<div className="rounded-md border bg-card overflow-hidden ">
				<div className="p-3 border-b flex items-center justify-between bg-primary/70">
					<div className="font-medium">{format(day, 'EEEE, MMM d, yyyy')}</div>

					{info.isClosed && (
						<Badge
							variant={info.reason ? 'destructive' : 'secondary'}
							className="h-5 px-2 text-[10px]"
						>
							{info.reason ? 'Closed' : 'Appointment Only'}
						</Badge>
					)}
				</div>

				<div className="grid grid-cols-[56px_1fr]">
					{/* time axis */}
					<div className="relative border-r">
						<div style={{ height: gridHeightPx }} className="relative">
							{hours.map((h) => {
								return (
									<div
										key={h}
										className="absolute left-0 w-full text-[10px] text-muted-foreground"
										style={{
											top: ((h - START_HOUR) * 60) / MINUTES_PER_PIXEL - 6,
										}}
									>
										<div className="px-4 py-3">{formatHourShort(h)}</div>
									</div>
								)
							})}
						</div>
					</div>

					{/* day column */}
					<div
						className="relative"
						style={{ height: gridHeightPx }}
						onClick={() => setSelectedDate(day)}
					>
						{hours.map((h) => {
							const open = isHourOpen(info, h)

							return (
								<div
									key={h}
									className={cn(
										// TODO fix colors day rows
										'absolute left-0 right-0 border-t bg-neutral-100',
										open && 'bg-(--green-logo)/60'
									)}
									style={{
										top: ((h - START_HOUR) * 60) / MINUTES_PER_PIXEL,
										height: 60 / MINUTES_PER_PIXEL,
									}}
								/>
							)
						})}

						{positionedEvents.map((c) => {
							const time = toAmPm(
								formatInTz(
									new Date(c.startsAtIso),
									centerTime.timeZone,
									'HH:mm'
								)
							)

							const widthPercent = 100 / c.columnCount
							const leftPercent = c.columnIndex * widthPercent

							return (
								<button
									key={c.id}
									onClick={(e) => {
										e.stopPropagation()
										setSelectedDate(day)
									}}
									className={cn(
										'absolute rounded border px-3 py-2 text-left text-[12px] overflow-hidden',
										getEventColorClasses(c),
										c.isCanceled && 'line-through opacity-70'
									)}
									style={{
										top: c.top,
										height: c.height,
										width: `calc(${widthPercent}% - 6px)`,
										left: `calc(${leftPercent}% + 3px)`,
									}}
									title={`${time} — ${c.title}`}
								>
									<div className="font-medium truncate">{c.title}</div>
									<div className="text-[11px] opacity-80 truncate">
										{time} • {c.kind === 'reservation' ? 'Resource' : 'Location'}:{' '}
										{c.location}
									</div>
								</button>
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	/* ============================
	   VIEW SWITCHER (Apple-ish)
	============================ */

	const ViewSwitcher = () => (
		<div className="flex items-center gap-2">
			<Button
				variant={view === 'day' ? 'default' : 'outline'}
				size="sm"
				onClick={() => setViewToToday('day')}
				className="gap-2"
			>
				<CalendarIcon className="h-4 w-4" />
				<span className="hidden sm:inline">Day</span>
			</Button>

			<Button
				variant={view === 'week' ? 'default' : 'outline'}
				size="sm"
				onClick={() => setViewToToday('week')}
				className="gap-2"
			>
				<CalendarRange className="h-4 w-4" />
				<span className="hidden sm:inline">Week</span>
			</Button>

			<Button
				variant={view === 'month' ? 'default' : 'outline'}
				size="sm"
				onClick={() => setViewToToday('month')}
				className="gap-2"
			>
				<CalendarDays className="h-4 w-4" />
				<span className="hidden sm:inline">Month</span>
			</Button>
		</div>
	)

	/* ============================
	   RENDER
	============================ */

	return (
		<div className="flex flex-col gap-4">
			{/* Toolbar */}
			<div className="grid grid-cols-1 xl:grid-cols-3 xl:items-center gap-3">
				<div className="flex mx-auto xl:mx-0">
					<Button
						variant="outline"
						size="sm"
						onClick={goToday}
						className="xl:hidden mr-2"
					>
						Today
					</Button>
					<ViewSwitcher />
				</div>
				<div className="flex items-center gap-2 mx-auto">
					<Button
						variant="ghost"
						size="icon"
						onClick={goPrev}
						aria-label="Previous"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div className="text-base xl:text-xl font-semibold text-center">
						{headerLabel}
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={goNext}
						aria-label="Next"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<div className="hidden xl:flex justify-end mx-auto xl:mx-0">
					<Button variant="outline" size="sm" onClick={goToday}>
						Today
					</Button>
				</div>
			</div>

			{/* Animated view container */}
			<div
				key={view + ':' + ymd(viewDate)}
				className="animate-in fade-in-0 duration-300"
			>
				{view === 'month' && <MonthView />}
				{view === 'week' && <WeekView />}
				{view === 'day' && <DayView />}
			</div>

			{/* DAY DETAILS DIALOG */}
			{selectedDate && (
				<Dialog open onOpenChange={() => setSelectedDate(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{formatLongDate(ymd(selectedDate))}</DialogTitle>
						</DialogHeader>
						<DayDetails date={selectedDate} />
					</DialogContent>
				</Dialog>
			)}
		</div>
	)
}
