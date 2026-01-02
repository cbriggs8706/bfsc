// components/shifts/AvailabilityDashboardClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { setAvailability } from '@/app/actions/substitute/set-availability'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AvailabilityValue } from '@/types/substitutes'
import { toAmPm } from '@/utils/time'
import { clearAvailability } from '@/app/actions/substitute/clear-availability'

//CORRECTED TIMEZONES

type Shift = {
	id: string
	weekday: number
	startTime: string
	endTime: string
}

type Recurrence = {
	id: string
	shiftId: string
	label: string
}

type AvailabilityRow = {
	shiftId: string
	shiftRecurrenceId: string | null
	level: AvailabilityValue
}

type ShiftCard = {
	shiftId: string
	weekday: number
	timeLabel: string
	recurrences: {
		recurrenceId: string
		label: string
	}[]
}

type Props = {
	shifts: Shift[]
	recurrences: Recurrence[]
	availability: AvailabilityRow[]
}

const WEEKDAYS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

type AvailabilityOption = {
	label: string
	value: AvailabilityValue
}

const OPTIONS: AvailabilityOption[] = [
	{ label: 'Usually', value: 'usually' },
	{ label: 'Maybe', value: 'maybe' },
	{ label: 'Not available', value: null },
]

export function AvailabilityDashboardClient({
	shifts,
	recurrences,
	availability,
}: Props) {
	/* --------------------------------------------
	 * Local optimistic state
	 * ------------------------------------------ */

	const [localAvailability, setLocalAvailability] = useState<
		Record<string, AvailabilityValue>
	>(() => {
		const map: Record<string, AvailabilityValue> = {}
		for (const a of availability) {
			map[`${a.shiftId}:${a.shiftRecurrenceId ?? 'any'}`] = a.level
		}
		return map
	})

	/* --------------------------------------------
	 * Build rows grouped by weekday
	 * ------------------------------------------ */

	const cardsByWeekday = useMemo(() => {
		const map = new Map<string, ShiftCard>()

		for (const r of recurrences) {
			const shift = shifts.find((s) => s.id === r.shiftId)
			if (!shift) continue

			const cardKey = shift.id

			if (!map.has(cardKey)) {
				map.set(cardKey, {
					shiftId: shift.id,
					weekday: shift.weekday,
					timeLabel: `${toAmPm(shift.startTime)}–${toAmPm(shift.endTime)}`,
					recurrences: [],
				})
			}

			map.get(cardKey)!.recurrences.push({
				recurrenceId: r.id,
				label: r.label,
			})
		}

		return Array.from(map.values()).reduce<Record<number, ShiftCard[]>>(
			(acc, card) => {
				acc[card.weekday] ??= []
				acc[card.weekday].push(card)
				return acc
			},
			{}
		)
	}, [shifts, recurrences])

	/* --------------------------------------------
	 * Change handler (optimistic)
	 * ------------------------------------------ */

	async function setValue(
		shiftId: string,
		recurrenceId: string | null,
		value: AvailabilityValue
	) {
		const key = `${shiftId}:${recurrenceId ?? 'any'}`

		// Optimistic UI update
		setLocalAvailability((prev) => ({
			...prev,
			[key]: value,
		}))

		// Persist
		if (value === null) {
			await clearAvailability({
				shiftId,
				shiftRecurrenceId: recurrenceId ?? undefined,
			})
			return
		}

		await setAvailability({
			shiftId,
			shiftRecurrenceId: recurrenceId ?? undefined,
			level: value, // ✅ now type-safe
		})
	}

	/* --------------------------------------------
	 * Render
	 * ------------------------------------------ */

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{Object.entries(cardsByWeekday)
				.sort(([a], [b]) => Number(a) - Number(b))
				.map(([weekday, cards]) => (
					<div key={weekday} className="flex flex-col">
						<h2 className="text-md font-semibold">
							{WEEKDAYS[Number(weekday)]}
						</h2>
						{cards.map((card) => (
							<Card key={card.shiftId}>
								<CardContent className="p-4 space-y-4">
									<div className="font-medium text-sm">{card.timeLabel}</div>

									<div className="space-y-2">
										{card.recurrences.map((rec) => {
											const key = `${card.shiftId}:${rec.recurrenceId}`
											const value = localAvailability[key] ?? null

											return (
												<div
													key={rec.recurrenceId}
													className="flex flex-col lg:flex-row items-center justify-between gap-3"
												>
													<div className="text-sm text-muted-foreground">
														{rec.label}
													</div>

													<div className="inline-flex rounded-lg border overflow-hidden">
														{OPTIONS.map((opt) => {
															const active = value === opt.value

															return (
																<button
																	key={opt.label}
																	type="button"
																	onClick={() =>
																		setValue(
																			card.shiftId,
																			rec.recurrenceId,
																			opt.value
																		)
																	}
																	className={cn(
																		'px-3 py-1.5 text-xs font-medium transition',
																		active
																			? 'bg-primary text-primary-foreground'
																			: 'bg-background hover:bg-muted',
																		'border-r last:border-r-0'
																	)}
																>
																	{opt.label}
																</button>
															)
														})}
													</div>
												</div>
											)
										})}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				))}
		</div>
	)
}
