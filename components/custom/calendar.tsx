'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { addMonths, subMonths, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toAmPm, formatLongDate } from '@/utils/time'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type Special = {
	id: string
	date: string
	isClosed: boolean
	opensAt: string | null
	closesAt: string | null
	reason?: string | null
}

type Weekly = {
	weekday: number
	opensAt: string
	closesAt: string
	isClosed: boolean
}

export default function KioskCalendar({
	specials,
	weekly,
	initialYear,
	initialMonth,
}: {
	specials: Special[]
	weekly: Weekly[]
	initialYear: number
	initialMonth: number
}) {
	const isMobile = useIsMobile()
	const [viewDate, setViewDate] = useState(
		new Date(initialYear, initialMonth, 1)
	)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)

	// Convert specials into a Map for fast lookup
	const specialsMap = new Map(specials.map((s) => [s.date, s]))

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

		const weekday = date.getDay() // 0-6
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

	const modifiers = {
		specialClosed: (date: Date) => {
			const info = getDayInfo(date)
			return info.source === 'special' && info.isClosed
		},
		specialOpen: (date: Date) => {
			const info = getDayInfo(date)
			return info.source === 'special' && !info.isClosed
		},
		weeklyClosed: (date: Date) => {
			const info = getDayInfo(date)
			return info.source === 'weekly' && info.isClosed
		},
	}

	const modifiersClassNames = {
		specialClosed: 'bg-red-200 border-red-400 text-red-700',
		specialOpen: 'bg-yellow-200 border-yellow-400 text-yellow-700',
		weeklyClosed: 'bg-neutral-200 border-neutral-400 text-neutral-700',
	}

	return (
		<div className="flex flex-col gap-6">
			<Calendar
				month={viewDate}
				onMonthChange={setViewDate}
				mode="single"
				selected={selectedDate ?? undefined}
				onSelect={(d) => d && setSelectedDate(d)}
				className="rounded-md border w-full bg-white"
				/** Add these */
				modifiers={modifiers}
				modifiersClassNames={modifiersClassNames}
			/>

			{/* RIGHT — Inline Panel (Desktop) */}
			{!isMobile && selectedDate && (
				<Card className="flex-1">
					<CardHeader>
						<CardTitle>
							{formatLongDate(format(selectedDate, 'yyyy-MM-dd'))}
						</CardTitle>
					</CardHeader>

					<CardContent>
						{(() => {
							const info = getDayInfo(selectedDate)

							if (info.source === 'special') {
								return (
									<p className="text-red-600 font-semibold">
										{info.reason ? `Closed for ${info.reason}` : 'Closed'}
									</p>
								)
							}

							if (info.isClosed) {
								return (
									<p className="text-neutral-700 font-semibold">
										Open By Appointment Only
									</p>
								)
							}

							return (
								<p>
									Open: {toAmPm(info.opensAt)} <br />
									Close: {toAmPm(info.closesAt)}
								</p>
							)
						})()}
					</CardContent>
				</Card>
			)}

			{/* MOBILE — Dialog */}
			{isMobile && selectedDate && (
				<Dialog
					open={!!selectedDate}
					onOpenChange={() => setSelectedDate(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{formatLongDate(format(selectedDate, 'yyyy-MM-dd'))}
							</DialogTitle>
						</DialogHeader>

						{(() => {
							const info = getDayInfo(selectedDate)

							if (info.source === 'special') {
								return (
									<p className="text-red-600 font-semibold">
										{info.reason ? `Closed for ${info.reason}` : 'Closed'}
									</p>
								)
							}

							if (info.isClosed) {
								return (
									<p className="text-neutral-700 font-semibold">
										Open By Appointment Only
									</p>
								)
							}

							return (
								<p>
									Open: {toAmPm(info.opensAt)} <br />
									Close: {toAmPm(info.closesAt)}
								</p>
							)
						})()}
					</DialogContent>
				</Dialog>
			)}
		</div>
	)
}
