// components/custom/SidebarCalendar.tsx
'use client'

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
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Special = {
	date: string // yyyy-mm-dd
	isClosed: boolean
}

type Weekly = {
	weekday: number // 0–6 (Sun–Sat)
	isClosed: boolean
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'R', 'F', 'Sa']

export function SidebarCalendar({
	specials,
	weekly,
}: {
	specials: Special[]
	weekly: Weekly[]
}) {
	const today = new Date()
	const [viewDate, setViewDate] = useState(startOfMonth(today))

	const monthStart = startOfMonth(viewDate)
	const monthEnd = endOfMonth(viewDate)

	const specialsMap = new Map(specials.map((s) => [s.date, s]))

	const days = eachDayOfInterval({
		start: monthStart,
		end: monthEnd,
	})

	const leadingBlanks = Array(getDay(monthStart)).fill(null)

	const isClosed = (date: Date) => {
		const ymd = format(date, 'yyyy-MM-dd')
		const special = specialsMap.get(ymd)
		if (special) return special.isClosed

		const weekday = date.getDay()
		return weekly.find((w) => w.weekday === weekday)?.isClosed ?? true
	}

	return (
		<div className="px-2 select-none">
			{/* Month + Year header with nav */}
			<div className="flex items-center justify-between mb-1">
				<button
					onClick={() => setViewDate((d) => subMonths(d, 1))}
					className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
					aria-label="Previous month"
				>
					<ChevronLeft className="h-3 w-3" />
				</button>

				{/* Center label */}
				<div
					className="text-xs font-medium text-muted-foreground cursor-pointer"
					onClick={() => setViewDate(startOfMonth(today))}
					title="Jump to current month"
				>
					{format(viewDate, 'MMMM yyyy')}
				</div>

				<button
					onClick={() => setViewDate((d) => addMonths(d, 1))}
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
					const closed = isClosed(day)
					const isToday =
						format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

					return (
						<div
							key={day.toISOString()}
							className={cn(
								'h-5 w-5 rounded-sm flex items-center justify-center text-[10px]',
								closed ? 'bg-red-300 text-red-900' : 'bg-muted text-foreground',
								isToday && 'ring-2 ring-primary'
							)}
						>
							{format(day, 'd')}
						</div>
					)
				})}
			</div>
		</div>
	)
}
