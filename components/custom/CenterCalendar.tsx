//components/custom/CenterCalendar.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

import { toAmPm, formatLongDate } from '@/utils/time'
import { useIsMobile } from '@/hooks/use-mobile'

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
	title: string
	location: string
	isCanceled: boolean
	presenters: string[]
}

/* ============================
   COMPONENT
============================ */

export default function CenterCalendar({
	specials,
	weekly,
	classes,
	initialYear,
	initialMonth,
}: {
	specials: Special[]
	weekly: Weekly[]
	classes: CalendarClass[]
	initialYear: number
	initialMonth: number
}) {
	const isMobile = useIsMobile()

	const [viewDate, setViewDate] = useState(
		new Date(initialYear, initialMonth, 1)
	)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)

	/* ============================
	   MAPS
	============================ */

	const specialsMap = new Map(specials.map((s) => [s.date, s]))

	const classesByDate = new Map<string, CalendarClass[]>()
	for (const c of classes) {
		const arr = classesByDate.get(c.date) ?? []
		arr.push(c)
		classesByDate.set(c.date, arr)
	}

	const hasClassesOnDay = (date: Date) => {
		const ymd = format(date, 'yyyy-MM-dd')
		return classesByDate.has(ymd)
	}

	/* ============================
	   DAY INFO
	============================ */

	const getDayInfo = (date: Date) => {
		const ymd = format(date, 'yyyy-MM-dd')
		const special = specialsMap.get(ymd)

		if (special) {
			return {
				isClosed: special.isClosed,
				opensAt: special.opensAt,
				closesAt: special.closesAt,
				reason: special.reason,
				source: 'special' as const,
			}
		}

		const weekday = date.getDay()
		const w = weekly.find((w) => w.weekday === weekday)

		if (!w) {
			return {
				isClosed: true,
				opensAt: null,
				closesAt: null,
				reason: null,
				source: 'missing' as const,
			}
		}

		return {
			isClosed: w.isClosed,
			opensAt: w.opensAt,
			closesAt: w.closesAt,
			reason: null,
			source: 'weekly' as const,
		}
	}

	/* ============================
	   CALENDAR MODIFIERS
	============================ */

	const modifiers = {
		specialClosed: (date: Date) =>
			getDayInfo(date).source === 'special' && getDayInfo(date).isClosed,

		specialOpen: (date: Date) =>
			getDayInfo(date).source === 'special' && !getDayInfo(date).isClosed,

		weeklyClosed: (date: Date) =>
			getDayInfo(date).source === 'weekly' && getDayInfo(date).isClosed,

		hasClass: (date: Date) => {
			const ymd = format(date, 'yyyy-MM-dd')
			return classesByDate.has(ymd)
		},
	}

	const modifiersClassNames = {
		specialClosed: 'bg-red-200 border-red-400 text-red-700',
		specialOpen: 'bg-yellow-200 border-yellow-400 text-yellow-700',
		weeklyClosed: 'bg-neutral-200 border-neutral-400 text-neutral-700',
		hasClass:
			'border-2 border-primary hover:border-primary/80 focus-visible:ring-2 focus-visible:ring-ring',
	}

	/* ============================
	   CLASS LIST RENDERER
	============================ */

	const renderClasses = (dayClasses: CalendarClass[]) => {
		if (dayClasses.length === 0) return null

		return (
			<div className="mt-4 space-y-2">
				<h3 className="font-semibold">Classes</h3>
				<ul className="space-y-2">
					{dayClasses.map((c) => {
						const startsAt = new Date(c.startsAtIso)

						return (
							<li
								key={c.id}
								className={`text-sm ${
									c.isCanceled ? 'line-through text-muted-foreground' : ''
								}`}
							>
								<div>
									{toAmPm(format(startsAt, 'HH:mm'))} — {c.title}
								</div>

								<div className="text-xs text-muted-foreground">
									{c.location}
									{c.isCanceled && ' (Canceled)'}
								</div>

								{c.presenters.length > 0 && (
									<div className="text-xs text-muted-foreground">
										Presenter{c.presenters.length > 1 ? 's' : ''}:{' '}
										{c.presenters.join(', ')}
									</div>
								)}
							</li>
						)
					})}
				</ul>
			</div>
		)
	}

	/* ============================
	   RENDER
	============================ */

	return (
		<div className="flex flex-col gap-6">
			<Calendar
				month={viewDate}
				onMonthChange={setViewDate}
				mode="single"
				selected={selectedDate ?? undefined}
				onSelect={(d) => d && setSelectedDate(d)}
				className="rounded-md border w-full bg-white"
				modifiers={modifiers}
				modifiersClassNames={modifiersClassNames}
			/>

			{/* DESKTOP PANEL */}
			{!isMobile && selectedDate && (
				<Card>
					<CardHeader>
						<CardTitle>
							{formatLongDate(format(selectedDate, 'yyyy-MM-dd'))}
						</CardTitle>
					</CardHeader>

					<CardContent>
						{(() => {
							const info = getDayInfo(selectedDate)
							const ymd = format(selectedDate, 'yyyy-MM-dd')
							const dayClasses = classesByDate.get(ymd) ?? []

							if (info.source === 'special') {
								return (
									<p className="text-red-600 font-semibold">
										{info.reason ? `Closed for ${info.reason}` : 'Closed'}
									</p>
								)
							}

							if (info.isClosed) {
								return (
									<>
										<p className="text-neutral-700 font-semibold">
											Open By Appointment Only
										</p>
										{renderClasses(dayClasses)}
									</>
								)
							}

							return (
								<>
									<p>
										Open: {toAmPm(info.opensAt)} <br />
										Close: {toAmPm(info.closesAt)}
									</p>
									{renderClasses(dayClasses)}
								</>
							)
						})()}
					</CardContent>
				</Card>
			)}

			{/* MOBILE DIALOG */}
			{isMobile && selectedDate && (
				<Dialog open onOpenChange={() => setSelectedDate(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{formatLongDate(format(selectedDate, 'yyyy-MM-dd'))}
							</DialogTitle>
						</DialogHeader>

						{(() => {
							const info = getDayInfo(selectedDate)
							const ymd = format(selectedDate, 'yyyy-MM-dd')
							const dayClasses = classesByDate.get(ymd) ?? []

							if (info.source === 'special') {
								return (
									<p className="text-red-600 font-semibold">
										{info.reason ? `Closed for ${info.reason}` : 'Closed'}
									</p>
								)
							}

							if (info.isClosed) {
								return (
									<>
										<p className="text-neutral-700 font-semibold">
											Open By Appointment Only
										</p>
										{renderClasses(dayClasses)}
									</>
								)
							}

							return (
								<>
									<p>
										Open: {toAmPm(info.opensAt)} <br />
										Close: {toAmPm(info.closesAt)}
									</p>
									{renderClasses(dayClasses)}
								</>
							)
						})()}
					</DialogContent>
				</Dialog>
			)}
		</div>
	)
}
