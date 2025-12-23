// components/report/ShiftReport.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TodayShiftCard } from '@/components/reports/TodayShiftCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangeButtons } from '@/components/custom/DateRangeButtons'
import { ShiftSummaryChart } from '@/components/reports/ShiftSummaryChart'
import type {
	DateRangePreset,
	ShiftSummaryPoint,
	TodayShift,
} from '@/types/shift-report'
import { supabase } from '@/lib/supabase-client'
import { format, isToday } from 'date-fns'

type Props = {
	initialShifts: TodayShift[]
	initialOffShift: TodayShift[]
	locale: string
}

export function ShiftReport({ initialShifts, initialOffShift, locale }: Props) {
	const [preset, setPreset] = useState<DateRangePreset>('lastWeek')
	const [summary, setSummary] = useState<ShiftSummaryPoint[]>([])
	const refetchTimer = useRef<number | null>(null)
	const [shifts, setShifts] = useState<TodayShift[]>(initialShifts)
	const [offShift, setOffShift] = useState<TodayShift[]>(initialOffShift)
	const [selectedDateStr, setSelectedDateStr] = useState(
		format(new Date(), 'yyyy-MM-dd')
	)
	const selectedDate = new Date(`${selectedDateStr}T12:00:00`)

	const refetchForDate = useCallback(async (dateStr: string) => {
		const res = await fetch(`/api/reports/shifts/day?date=${dateStr}`, {
			cache: 'no-store',
		})

		if (!res.ok) return

		const json = await res.json()
		setShifts(json.shifts)
		setOffShift(json.offShift)
	}, [])

	const scheduleRefetch = useCallback(() => {
		if (!isToday(selectedDate)) return

		if (refetchTimer.current) window.clearTimeout(refetchTimer.current)

		refetchTimer.current = window.setTimeout(() => {
			refetchForDate(selectedDateStr)
		}, 250)
	}, [selectedDate, selectedDateStr, refetchForDate])

	useEffect(() => {
		let cancelled = false

		;(async () => {
			const res = await fetch(`/api/reports/shifts/summary?preset=${preset}`, {
				cache: 'no-store',
			})

			if (!res.ok) return

			const json = await res.json()
			if (!cancelled) {
				setSummary(json.summary)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [preset])

	useEffect(() => {
		const channel = supabase
			.channel('kiosk-day-live')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_shift_logs' },
				scheduleRefetch
			)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_visit_logs' },
				scheduleRefetch
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'kiosk_shift_logs' },
				scheduleRefetch
			)
			.subscribe()

		return () => {
			if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
			supabase.removeChannel(channel)
		}
	}, [scheduleRefetch])

	return (
		<>
			<Card>
				<CardHeader className="flex flex-wrap gap-4 items-center">
					<CardTitle>
						Shifts for {format(selectedDate, 'MMM d, yyyy')}
					</CardTitle>

					<input
						type="date"
						value={selectedDateStr}
						onChange={(e) => {
							const next = e.target.value
							setSelectedDateStr(next)
							refetchForDate(next)
						}}
						className="border rounded px-2 py-1 text-sm"
					/>

					<Button
						onClick={() => {
							const dateStr = selectedDateStr
							const header = `Shift Report – ${format(
								selectedDate,
								'MMMM d, yyyy'
							)}`
							window.open(
								`/shifts/report?date=${dateStr}&header=${encodeURIComponent(
									header
								)}`,
								'_blank',
								'width=1200,height=900'
							)
						}}
					>
						Print
					</Button>
				</CardHeader>

				<CardContent className="space-y-4">
					{shifts.length === 0 ? (
						<p className="text-muted-foreground">
							No shifts scheduled for today.
						</p>
					) : (
						shifts.map((shift) => (
							<TodayShiftCard key={shift.shiftId} shift={shift} />
						))
					)}

					{/* Off-shift section */}
					{offShift.length > 0 && (
						<div className="space-y-4">
							{offShift.map((shift) => (
								<TodayShiftCard key={shift.shiftId} shift={shift} />
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<DateRangeButtons value={preset} onChange={setPreset} />

						<Button
							variant="default"
							onClick={() => {
								const header = `Shift Summary – ${format(
									selectedDate,
									'MMMM d, yyyy'
								)}`
								window.open(
									`/shifts/summary?header=${encodeURIComponent(header)}`,
									'_blank',
									'width=1200,height=900'
								)
							}}
						>
							Print Summary Charts
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					<ShiftSummaryChart data={summary} preset={preset} />
				</CardContent>
			</Card>
		</>
	)
}
