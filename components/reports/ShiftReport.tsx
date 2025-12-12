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
	ShiftReportConsultant,
	ShiftReportPatron,
	ShiftSummaryPoint,
	TodayShift,
} from '@/types/shift-report'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase-client'

type Props = {
	initialShifts: TodayShift[]
	initialOffShift: {
		consultants: ShiftReportConsultant[]
		patrons: ShiftReportPatron[]
	}
}
type OffShift = {
	consultants: ShiftReportConsultant[]
	patrons: ShiftReportPatron[]
}

export function ShiftReport({ initialShifts, initialOffShift }: Props) {
	const [preset, setPreset] = useState<DateRangePreset>('wtd')
	const [summary, setSummary] = useState<ShiftSummaryPoint[]>([])
	const refetchTimer = useRef<number | null>(null)
	const [shifts, setShifts] = useState<TodayShift[]>(initialShifts)
	const [offShift, setOffShift] = useState<OffShift>(initialOffShift)

	const refetchToday = useCallback(async () => {
		const res = await fetch('/api/reports/shifts/today', { cache: 'no-store' })
		if (!res.ok) return
		const json = await res.json()
		setShifts(json.shifts)
		setOffShift(json.offShift)
	}, [])

	const scheduleRefetch = useCallback(() => {
		if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
		refetchTimer.current = window.setTimeout(() => {
			refetchToday()
		}, 250) // debounce
	}, [refetchToday])

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
		// Subscribe to inserts on BOTH tables
		const channel = supabase
			.channel('kiosk-today-live')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_shift_logs' },
				() => scheduleRefetch()
			)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_visit_logs' },
				() => scheduleRefetch()
			)
			// Optional: if you ever start updating departures and want UI to react:
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'kiosk_shift_logs' },
				() => scheduleRefetch()
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
				<CardHeader className="space-y-4">
					<CardTitle>Today’s Shifts</CardTitle>
					<Button onClick={() => window.print()}>Print</Button>
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
					{(offShift.consultants.length > 0 || offShift.patrons.length > 0) && (
						<Card>
							<CardHeader>
								<CardTitle>Arrived Outside Scheduled Shifts</CardTitle>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Consultants */}
								<div>
									<p className="text-sm font-medium mb-2">Consultants</p>

									{offShift.consultants.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No off-shift consultants.
										</p>
									) : (
										<div className="flex gap-3 flex-wrap">
											{offShift.consultants.map((c) => (
												<div key={c.userId} className="flex items-center gap-2">
													<Avatar>
														<AvatarImage src={c.profileImageUrl ?? undefined} />
														<AvatarFallback>
															{c.fullName.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="text-sm">{c.fullName}</p>
														<p className="text-xs text-muted-foreground">
															Arrived{' '}
															{new Date(c.arrivalAt).toLocaleTimeString()}
														</p>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Patrons */}
								<div>
									<p className="text-sm font-medium mb-2">Patrons</p>

									{offShift.patrons.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No off-shift patrons.
										</p>
									) : (
										<ul className="space-y-1 text-sm">
											{offShift.patrons.map((p) => (
												<li key={p.visitId} className="flex justify-between">
													<span>{p.fullName}</span>
													<span className="text-muted-foreground">
														{new Date(p.arrivedAt).toLocaleTimeString()}
													</span>
												</li>
											))}
										</ul>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-4">
					<DateRangeButtons value={preset} onChange={setPreset} />
				</CardHeader>

				<CardContent>
					<ShiftSummaryChart data={summary} preset={preset} />
				</CardContent>
			</Card>
		</>
	)
}
