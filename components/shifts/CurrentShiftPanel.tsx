// components/shifts/CurrentShiftPanel.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase-client'
import { format, isToday } from 'date-fns'
import type { TodayShift } from '@/types/shift-report'
import { toAmPm } from '@/utils/time'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'

type Props = {
	title?: string
	pollMs?: number // optional: if you still want periodic polling in addition to realtime
	showPatrons?: boolean
}

/**
 * Condensed "today-only" version of ShiftReport.
 * - No date filter
 * - No print button
 * - Compact layout
 */
export function CurrentShiftPanel({
	title = 'Today in the Center',
	pollMs,
	showPatrons = true,
}: Props) {
	const [loading, setLoading] = useState(true)
	const [shifts, setShifts] = useState<TodayShift[]>([])
	const [offShift, setOffShift] = useState<TodayShift[]>([])
	const refetchTimer = useRef<number | null>(null)
	const pollTimer = useRef<number | null>(null)

	const todayStr = format(new Date(), 'yyyy-MM-dd')
	const todayDate = new Date(`${todayStr}T12:00:00`)

	async function markDeparted(url: string) {
		await fetch(url, { method: 'POST' })
		refetch()
	}

	const refetch = useCallback(async () => {
		setLoading(true)
		try {
			// Prefer /today if it exists and returns { shifts, offShift }
			let res = await fetch(`/api/reports/shifts/today`, { cache: 'no-store' })

			// Fallback to day endpoint if /today isn’t implemented
			if (!res.ok) {
				res = await fetch(`/api/reports/shifts/day?date=${todayStr}`, {
					cache: 'no-store',
				})
			}

			if (!res.ok) return

			const json = await res.json()
			setShifts(json.shifts ?? [])
			setOffShift(json.offShift ?? [])
		} finally {
			setLoading(false)
		}
	}, [todayStr])

	const scheduleRefetch = useCallback(() => {
		// Only do the “fast re-fetch” logic for today
		if (!isToday(todayDate)) return

		if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
		refetchTimer.current = window.setTimeout(() => {
			refetch()
		}, 250)
	}, [refetch, todayDate])

	useEffect(() => {
		refetch()
	}, [refetch])

	// Optional polling
	useEffect(() => {
		if (!pollMs) return
		if (pollTimer.current) window.clearInterval(pollTimer.current)

		pollTimer.current = window.setInterval(() => {
			refetch()
		}, pollMs)

		return () => {
			if (pollTimer.current) window.clearInterval(pollTimer.current)
		}
	}, [pollMs, refetch])

	// Realtime updates
	useEffect(() => {
		const channel = supabase
			.channel('kiosk-today-live')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_shift_logs' },
				scheduleRefetch
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'kiosk_shift_logs' },
				scheduleRefetch
			)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'kiosk_visit_logs' },
				scheduleRefetch
			)
			.subscribe()

		return () => {
			if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
			supabase.removeChannel(channel)
		}
	}, [scheduleRefetch])

	if (loading) {
		return <p className="text-base">Loading…</p>
	}

	const hasAny =
		shifts.some((s) => s.consultants.length > 0 || s.patrons.length > 0) ||
		offShift.length > 0

	if (!hasAny) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-base">
						No consultant or patron activity recorded today.
					</p>
				</CardContent>
			</Card>
		)
	}
	return (
		<>
			<h2 className="text-2xl font-semibold">{title}</h2>

			{/* Scheduled shifts */}
			{shifts.map((shift) => (
				<Card key={shift.shiftId} className="p-4 space-y-3">
					<p className="text-base font-semibold">
						{shift.startTime && shift.endTime
							? `${toAmPm(shift.startTime)} – ${toAmPm(shift.endTime)}`
							: 'Outside of Regular Shift'}
					</p>

					{/* Consultants */}
					<div>
						<p className="text-xs font-medium mb-1">Consultants</p>

						<ul className="space-y-2">
							{shift.consultants.map((c) => (
								<li
									key={c.userId}
									className="
									grid
									grid-cols-1
									sm:grid-cols-2
									md:grid-cols-4
									items-center
									gap-x-3
									gap-y-1
									border-b
									last:border-b-0
									pb-2
								"
								>
									{/* Name */}
									<span className="font-medium">{c.fullName}</span>

									{/* Role */}
									<span className="text-sm text-muted-foreground">
										Consultant
									</span>

									{/* Arrival */}
									<span className="text-sm">
										Arrived {new Date(c.arrivalAt).toLocaleTimeString()}
									</span>

									{/* Action */}
									<div className="md:text-right">
										{c.actualDepartureAt ? (
											<span className="text-sm text-muted-foreground">
												Departed{' '}
												{new Date(c.actualDepartureAt).toLocaleTimeString()}
											</span>
										) : (
											<Button
												variant="link"
												size="sm"
												onClick={() =>
													markDeparted(
														`/api/kiosk/shift/${c.shiftLogId}/depart`
													)
												}
											>
												Mark Departure
												<ArrowRight className="ml-1 h-4 w-4" />
											</Button>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* Patrons */}
					{showPatrons && (
						<div>
							<p className="text-xs font-medium mb-1">Patrons</p>

							{shift.patrons.length === 0 ? (
								<p className="text-base">—</p>
							) : (
								<ul className="space-y-2">
									{shift.patrons.slice(0, 8).map((p) => (
										<li
											key={p.visitId}
											className="
											grid
											grid-cols-1
											sm:grid-cols-2
											md:grid-cols-4
											items-center
											gap-x-3
											gap-y-1
											border-b
											last:border-b-0
											pb-2
										"
										>
											{/* Name */}
											<span className="font-medium truncate">{p.fullName}</span>

											{/* Purpose */}
											<span className="text-sm text-muted-foreground truncate">
												{p.purposeName ?? '—'}
											</span>

											{/* Arrival */}
											<span className="text-sm">
												Arrived {new Date(p.arrivedAt).toLocaleTimeString()}
											</span>

											{/* Action */}
											<div className="md:text-right">
												{p.departedAt ? (
													<span className="text-sm text-muted-foreground">
														Departed{' '}
														{new Date(p.departedAt).toLocaleTimeString()}
													</span>
												) : (
													<Button
														variant="link"
														size="sm"
														onClick={() =>
															markDeparted(
																`/api/kiosk/visit/${p.visitId}/depart`
															)
														}
													>
														Mark Departure
														<ArrowRight className="ml-1 h-4 w-4" />
													</Button>
												)}
											</div>
										</li>
									))}

									{shift.patrons.length > 8 && (
										<li className="text-xs text-muted-foreground">
											+{shift.patrons.length - 8} more
										</li>
									)}
								</ul>
							)}
						</div>
					)}
				</Card>
			))}

			{/* Off-shift */}
			{offShift.length > 0 && (
				<Card className="p-4">
					{offShift.map((shift) => (
						<div key={shift.shiftId} className="space-y-2">
							<p className="text-base font-semibold">
								Outside of Regular Shift
							</p>

							<p className="text-sm">
								<strong>Consultants:</strong>{' '}
								{shift.consultants.map((c) => c.fullName).join(', ') || '—'}
							</p>

							{showPatrons && (
								<p className="text-sm">
									<strong>Patrons:</strong>{' '}
									{shift.patrons.map((p) => p.fullName).join(', ') || '—'}
								</p>
							)}
						</div>
					))}
				</Card>
			)}
		</>
	)
}
