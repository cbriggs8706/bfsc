// components/custom/SidebarCalendar.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
	format,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	getDay,
	addMonths,
	subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
	getDayInfo,
	getStatusLine,
	type Weekly,
	type Special,
	getCenterStatus,
} from '@/lib/calendar/day-info'
import { Button } from '../ui/button'
import { toZonedTime } from 'date-fns-tz'

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'R', 'F', 'Sa']

export function SidebarCalendar({
	specials,
	weekly,
	locale,
	centerTimeZone,
}: {
	specials: Special[]
	weekly: Weekly[]
	locale: string
	centerTimeZone: string
}) {
	const router = useRouter()
	const today = toZonedTime(new Date(), centerTimeZone)

	const [expanded, setExpanded] = useState(false)
	const [viewDate, setViewDate] = useState(startOfMonth(today))

	/* ============================
	   STATUS LINE (shared logic)
	============================ */
	// TEST A DIFFERENT DATE
	// const now =
	// 	process.env.NODE_ENV === 'development'
	// 		? new Date('2026-01-04T09:00:00') // pick any date/time
	// 		: new Date()

	// const statusLine = useMemo(
	// 	() => getCenterStatus(now, specials, weekly),
	// 	[specials, weekly]
	// )
	const statusLine = useMemo(
		() => getCenterStatus(toZonedTime(new Date(), centerTimeZone), specials, weekly),
		[specials, weekly, centerTimeZone]
	)

	/* ============================
	   MINI MONTH CALC
	============================ */

	const monthStart = startOfMonth(viewDate)
	const monthEnd = endOfMonth(viewDate)

	const days = eachDayOfInterval({
		start: monthStart,
		end: monthEnd,
	})

	const leadingBlanks = Array(getDay(monthStart)).fill(null)

	/* ============================
	   RENDER
	============================ */

	return (
		<div className="px-2 select-none">
			{/* Compact status line */}
			<Button
				onClick={() => setExpanded((v) => !v)}
				variant="outline"
				className="flex flex-col w-full text-left space-y-0.5 h-fit"
			>
				<div className="flex items-center gap-2 text-xs font-medium">
					<span
						className={cn(
							'flex h-2 w-2 rounded-full',
							statusLine.isOpen ? 'bg-green-600' : 'bg-red-600'
						)}
					/>
					<span className="flex">{statusLine.primary}</span>
				</div>

				<div className="flex text-sm">{statusLine.secondary}</div>
			</Button>

			{/* Expandable mini calendar */}
			{expanded && (
				<div
					className="mt-2 cursor-pointer"
					onClick={() => router.push(`/${locale}/calendar`)}
				>
					{/* Month header */}
					<div className="flex items-center justify-between mb-1">
						<button
							onClick={(e) => {
								e.stopPropagation()
								setViewDate((d) => subMonths(d, 1))
							}}
							className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
							aria-label="Previous month"
						>
							<ChevronLeft className="h-3 w-3" />
						</button>

						<div className="text-xs font-medium text-muted-foreground">
							{format(viewDate, 'MMMM yyyy')}
						</div>

						<button
							onClick={(e) => {
								e.stopPropagation()
								setViewDate((d) => addMonths(d, 1))
							}}
							className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
							aria-label="Next month"
						>
							<ChevronRight className="h-3 w-3" />
						</button>
					</div>

					{/* Day headers */}
					<div className="grid grid-cols-7 gap-1 mb-1 text-[10px] text-muted-foreground text-center">
						{DAY_HEADERS.map((d) => (
							<div key={d}>{d}</div>
						))}
					</div>

					{/* Days grid */}
					<div className="grid grid-cols-7 gap-1">
						{leadingBlanks.map((_, i) => (
							<div key={`blank-${i}`} className="h-5 w-5" />
						))}

						{days.map((day) => {
							const info = getDayInfo(day, specials, weekly)
							const isToday =
								format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

							return (
								<div
									key={day.toISOString()}
									className={cn(
										'h-5 w-5 rounded-sm flex items-center justify-center text-[10px]',
										info.isClosed
											? 'bg-red-300 text-red-900'
											: 'bg-muted text-foreground',
										isToday && 'ring-2 ring-primary'
									)}
								>
									{format(day, 'd')}
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
