// components/shifts/CurrentShiftPanel.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase-client'
import type { TodayShift } from '@/types/shift-report'
import {
	formatInTz,
	toLocalDateTime,
	toLocalDateTimeInputValue,
	ymdInTz,
} from '@/utils/time'
import { fromZonedTime } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import Link from 'next/link'
import { CenterTimeConfig } from '@/lib/time/center-time'

type Props = {
	title?: string
	pollMs?: number
	showPatrons?: boolean
	locale: string
	centerTime: CenterTimeConfig
}

type DisplayCard =
	| {
			key: string
			kind: 'regular'
			label: string
			startTime: string
			endTime: string
			shift: TodayShift
	  }
	| {
			key: 'outside'
			kind: 'outside'
			label: 'Outside of Regular Shift'
			shift: OutsideShift | null
	  }

type OutsideShift = {
	workers: TodayShift['workers']
	patrons: TodayShift['patrons']
}

type Departing = { kind: 'worker'; id: string } | { kind: 'patron'; id: string }

function toCenterUtcDate(todayStr: string, hhmm: string, timeZone: string) {
	const local = toLocalDateTime(todayStr, hhmm)
	return fromZonedTime(local, timeZone)
}

function isNowInShift(
	todayStr: string,
	now: Date,
	start?: string | null,
	end?: string | null,
	timeZone?: string
) {
	if (!start || !end || !timeZone) return false
	const s = toCenterUtcDate(todayStr, start, timeZone)
	const e = toCenterUtcDate(todayStr, end, timeZone)
	// inclusive start, exclusive end
	return now >= s && now < e
}

function combineOffShift(offShift: TodayShift[]): OutsideShift | null {
	if (!offShift || offShift.length === 0) return null

	return {
		workers: offShift.flatMap((s) => s.workers ?? []),
		patrons: offShift.flatMap((s) => s.patrons ?? []),
	}
}

//CORRECTED TIMEZONE

export function CurrentShiftPanel({
	title = 'Today in the Center',
	pollMs,
	showPatrons = true,
	locale,
	centerTime,
}: Props) {
	const [loading, setLoading] = useState(true)
	const [shifts, setShifts] = useState<TodayShift[]>([])
	const [offShift, setOffShift] = useState<TodayShift[]>([])
	const refetchTimer = useRef<number | null>(null)
	const pollTimer = useRef<number | null>(null)

	// selection state
	const [selectedKey, setSelectedKey] = useState<string | null>(null)
	const [manualPick, setManualPick] = useState(false)

	const todayStr = ymdInTz(new Date(), centerTime.timeZone)

	const [departing, setDeparting] = useState<Departing | null>(null)

	const refetch = useCallback(async () => {
		setLoading(true)
		try {
			let res = await fetch(`/api/reports/shifts/today`, { cache: 'no-store' })
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
		// This panel always represents "today" in center time
		if (refetchTimer.current) window.clearTimeout(refetchTimer.current)

		refetchTimer.current = window.setTimeout(() => {
			refetch()
		}, 250)
	}, [refetch])

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

	// Build the cards list (regular shifts + outside)
	const cards = useMemo<DisplayCard[]>(() => {
		const regular = shifts.map((s) => ({
			key: `shift:${s.shiftId}`,
			kind: 'regular' as const,
			label: `${formatInTz(
				toCenterUtcDate(todayStr, s.startTime!, centerTime.timeZone),
				centerTime.timeZone,
				centerTime.timeFormat
			)} – ${formatInTz(
				toCenterUtcDate(todayStr, s.endTime!, centerTime.timeZone),
				centerTime.timeZone,
				centerTime.timeFormat
			)}`,
			startTime: s.startTime!,
			endTime: s.endTime!,
			shift: s,
		}))

		const outsideShift = combineOffShift(offShift)

		const outside: DisplayCard = {
			key: 'outside',
			kind: 'outside',
			label: 'Outside of Regular Shift',
			shift: outsideShift,
		}

		return [...regular, outside]
	}, [shifts, offShift, todayStr, centerTime.timeZone, centerTime.timeFormat])

	const currentKey = useMemo(() => {
		const nowUtc = new Date()
		// 1) find a regular shift that matches current time
		const activeRegular = cards.find(
			(c) =>
				c.kind === 'regular' &&
				isNowInShift(
					todayStr,
					nowUtc,
					c.startTime,
					c.endTime,
					centerTime.timeZone
				)
		)

		// 2) if none, outside
		return activeRegular?.key ?? 'outside'
	}, [cards, todayStr, centerTime.timeZone])

	// Keep selected card synced to "current" unless user manually picked another
	useEffect(() => {
		if (!manualPick) setSelectedKey(currentKey)
	}, [currentKey, manualPick])

	// Tick every 30s so the panel flips when time crosses shift boundaries
	useEffect(() => {
		const t = window.setInterval(() => {
			if (!manualPick) setSelectedKey(currentKey)
		}, 30_000)
		return () => window.clearInterval(t)
	}, [currentKey, manualPick])

	const selected = useMemo(() => {
		const key = selectedKey ?? currentKey
		return cards.find((c) => c.key === key) ?? cards[cards.length - 1]
	}, [cards, selectedKey, currentKey])

	if (loading) return <p className="text-base">Loading…</p>

	const hasAny =
		shifts.some((s) => s.workers.length > 0 || s.patrons.length > 0) ||
		offShift.some(
			(s) => (s.workers?.length ?? 0) > 0 || (s.patrons?.length ?? 0) > 0
		)

	if (!hasAny) {
		return (
			<div className="space-y-3">
				<h2 className="text-2xl font-semibold">{title}</h2>
				<Card>
					<CardContent className="pt-6">
						<p className="text-base">
							No worker or patron activity recorded today.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	const selectedShift = selected.shift

	return (
		<div className="space-y-3">
			<div className="flex flex-col md:flex-row items-start justify-between gap-3">
				<div>
					<h2 className="text-2xl font-semibold">{title}</h2>
					<p className="text-sm text-muted-foreground">
						Showing: <span className="font-medium">{selected.label}</span>
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link href={`/${locale}/shifts/reports`}>
						<Button variant="outline" size="sm">
							Shift Reports
						</Button>
					</Link>
					{/* <Button
						variant="outline"
						size="sm"
						onClick={() => {
							setManualPick(false)
							setSelectedKey(currentKey)
						}}
					>
						Current
					</Button> */}
				</div>
			</div>

			{/* Shift selector buttons */}
			<div className="flex flex-wrap gap-2">
				{cards.map((c) => {
					const isSelected = c.key === selected.key
					const isCurrent = c.key === currentKey

					return (
						<Button
							key={c.key}
							size="sm"
							variant={isSelected ? 'default' : 'outline'}
							className={cn(isCurrent && !isSelected && 'border-primary')}
							onClick={() => {
								setManualPick(true)
								setSelectedKey(c.key)
							}}
						>
							{c.kind === 'outside' ? 'Outside' : c.label}
							{isCurrent ? (
								<span className="ml-2 text-[10px] opacity-80">(now)</span>
							) : null}
						</Button>
					)
				})}
			</div>

			{/* ONE visible card */}
			<Card className="p-4 space-y-3">
				<p className="text-base font-semibold">{selected.label}</p>

				{/* Workers */}
				<div>
					<p className="text-xs font-medium mb-1">Workers</p>

					{!selectedShift || selectedShift.workers.length === 0 ? (
						<p className="text-base">—</p>
					) : (
						<ul className="space-y-2">
							{selectedShift.workers.map((c) => (
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
									<span className="font-medium">{c.fullName}</span>

									<span className="text-sm text-muted-foreground">Worker</span>

									<span className="text-sm">
										Arrived{' '}
										{formatInTz(
											new Date(c.arrivalAt),
											centerTime.timeZone,
											centerTime.timeFormat
										)}
									</span>

									<div className="md:text-right">
										{c.actualDepartureAt ? (
											<span className="text-sm text-muted-foreground">
												Departed{' '}
												{formatInTz(
													new Date(c.actualDepartureAt),
													centerTime.timeZone,
													centerTime.timeFormat
												)}
											</span>
										) : (
											<Button
												variant="link"
												size="sm"
												onClick={() =>
													setDeparting({ kind: 'worker', id: c.shiftLogId })
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
					)}
				</div>

				{/* Patrons */}
				{showPatrons && (
					<div>
						<p className="text-xs font-medium mb-1">Patrons</p>

						{!selectedShift || selectedShift.patrons.length === 0 ? (
							<p className="text-base">—</p>
						) : (
							<ul className="space-y-2">
								{selectedShift.patrons.slice(0, 8).map((p) => (
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
										<span className="font-medium truncate">{p.fullName}</span>

										<span className="text-sm text-muted-foreground truncate">
											{p.purposeName ?? '—'}
										</span>

										<span className="text-sm">
											Arrived{' '}
											{formatInTz(
												new Date(p.arrivedAt),
												centerTime.timeZone,
												centerTime.timeFormat
											)}
										</span>

										<div className="md:text-right">
											{p.departedAt ? (
												<span className="text-sm text-muted-foreground">
													Departed{' '}
													{formatInTz(
														new Date(p.departedAt),
														centerTime.timeZone,
														centerTime.timeFormat
													)}
												</span>
											) : (
												<Button
													variant="link"
													size="sm"
													onClick={() =>
														setDeparting({ kind: 'patron', id: p.visitId })
													}
												>
													Mark Departure
													<ArrowRight className="ml-1 h-4 w-4" />
												</Button>
											)}
										</div>
									</li>
								))}

								{selectedShift.patrons.length > 8 && (
									<li className="text-xs text-muted-foreground">
										+{selectedShift.patrons.length - 8} more
									</li>
								)}
							</ul>
						)}
					</div>
				)}
				{departing && (
					<MarkDepartureDialog
						key={departing.id}
						open
						onClose={() => setDeparting(null)}
						onConfirm={async (iso) => {
							const url =
								departing.kind === 'worker'
									? `/api/kiosk/shift/${departing.id}/depart`
									: `/api/kiosk/visit/${departing.id}/depart`

							await fetch(url, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ departureAt: iso }),
							})

							setDeparting(null)
							refetch()
						}}
					/>
				)}
			</Card>
		</div>
	)
}

function MarkDepartureDialog({
	open,
	onClose,
	onConfirm,
}: {
	open: boolean
	onClose: () => void
	onConfirm: (iso: string) => void
}) {
	const [time, setTime] = useState(() => toLocalDateTimeInputValue())

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Mark Departure</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					<label className="text-sm font-medium">Departure time</label>
					<Input
						type="datetime-local"
						value={time}
						onChange={(e) => setTime(e.target.value)}
					/>
				</div>

				<DialogFooter className="mt-4">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={() =>
							// convert local input → ISO UTC for backend
							onConfirm(new Date(time).toISOString())
						}
					>
						Confirm Departure
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
