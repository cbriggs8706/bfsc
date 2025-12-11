'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Trash2, Plus } from 'lucide-react'
import { toAmPm } from '@/utils/time'

type Day = {
	weekday: number
	label: string
	opensAt: string
	closesAt: string
}

type Shift = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	isActive: boolean
	notes: string | null
}

type Props = {
	days: Day[]
	shifts: Shift[]
}

export function ShiftDefinitionsManager({ days, shifts }: Props) {
	const [localShifts, setLocalShifts] = useState<Shift[]>(shifts)
	const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

	const setLoading = (id: string, isLoading: boolean) => {
		setLoadingIds((prev) => {
			const copy = new Set(prev)
			if (isLoading) copy.add(id)
			else copy.delete(id)
			return copy
		})
	}

	// --------------------------
	// Add Shift
	// --------------------------
	const handleAddShift = async (day: Day) => {
		const tempId = `temp-${day.weekday}-${Date.now()}`
		const newShift: Shift = {
			id: tempId,
			weekday: day.weekday,
			startTime: day.opensAt,
			endTime: day.closesAt,
			isActive: true,
			notes: '',
		}

		setLocalShifts((prev) => [...prev, newShift])
		setLoading(tempId, true)

		try {
			const res = await fetch('/api/shifts/definitions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					weekday: day.weekday,
					startTime: day.opensAt,
					endTime: day.closesAt,
					isActive: true,
					notes: '',
				}),
			})

			if (!res.ok) throw new Error('Failed to create shift')

			const data: { id: string } = await res.json()

			setLocalShifts((prev) =>
				prev.map((s) => (s.id === tempId ? { ...s, id: data.id } : s))
			)
		} catch (err) {
			console.error(err)
			setLocalShifts((prev) => prev.filter((s) => s.id !== tempId))
		} finally {
			setLoading(tempId, false)
		}
	}

	// --------------------------
	// Update Shift
	// --------------------------
	const handleUpdateShift = async (
		shiftId: string,
		updates: Partial<Shift>
	) => {
		setLocalShifts((prev) =>
			prev.map((s) => (s.id === shiftId ? { ...s, ...updates } : s))
		)

		setLoading(shiftId, true)

		try {
			const res = await fetch('/api/shifts/definitions', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: shiftId, ...updates }),
			})
			if (!res.ok) throw new Error('Failed to update shift')
		} catch (err) {
			console.error(err)
		} finally {
			setLoading(shiftId, false)
		}
	}

	// --------------------------
	// Delete Shift
	// --------------------------
	const handleDeleteShift = async (shiftId: string) => {
		const existing = localShifts.find((s) => s.id === shiftId)
		if (!existing) return

		setLocalShifts((prev) => prev.filter((s) => s.id !== shiftId))
		setLoading(shiftId, true)

		try {
			const res = await fetch('/api/shifts/definitions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: shiftId }),
			})

			if (!res.ok) throw new Error('Failed to delete shift')
		} catch (err) {
			console.error(err)
			setLocalShifts((prev) => [...prev, existing])
		} finally {
			setLoading(shiftId, false)
		}
	}

	// ======================================================
	// UI
	// ======================================================

	return (
		<div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
			{days.map((day) => {
				const dayShifts = localShifts
					.filter((s) => s.weekday === day.weekday)
					.sort((a, b) => a.startTime.localeCompare(b.startTime))

				return (
					<Card key={day.weekday}>
						<CardHeader className="flex items-center justify-between">
							<div className="flex flex-col">
								<span className="font-semibold text-xl">{day.label}</span>
								<span className="text-[13px] text-muted-foreground">
									Center open {toAmPm(day.opensAt)}–{toAmPm(day.closesAt)}
								</span>
							</div>

							<Button
								size="icon"
								variant="outline"
								className="h-7 w-7"
								onClick={() => handleAddShift(day)}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</CardHeader>

						<CardContent className="space-y-3">
							{dayShifts.length === 0 && (
								<p className="text-xs text-muted-foreground">
									No shifts defined. Click + to add one.
								</p>
							)}

							{dayShifts.map((shift) => {
								const busy = loadingIds.has(shift.id)

								return (
									<Card
										key={shift.id}
										className={cn(
											'p-3 space-y-3 border rounded-lg',
											!shift.isActive && 'opacity-50'
										)}
									>
										{/* Shift Header */}
										<div className="flex items-center justify-between">
											<div className="font-semibold text-sm">
												{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
											</div>

											<Button
												size="icon"
												variant="ghost"
												className="text-destructive h-8 w-8"
												disabled={busy}
												onClick={() => handleDeleteShift(shift.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>

										{/* Start / End Inputs */}
										<div className="grid grid-cols-[1fr_1fr] gap-3">
											<div>
												<Label className="text-[10px]">Start</Label>
												<Input
													type="time"
													value={shift.startTime}
													className="h-8 text-xs"
													disabled={busy}
													onChange={(e) =>
														handleUpdateShift(shift.id, {
															startTime: e.target.value,
														})
													}
												/>
											</div>

											<div>
												<Label className="text-[10px]">End</Label>
												<Input
													type="time"
													value={shift.endTime}
													className="h-8 text-xs"
													disabled={busy}
													onChange={(e) =>
														handleUpdateShift(shift.id, {
															endTime: e.target.value,
														})
													}
												/>
											</div>
										</div>

										{/* Active Toggle */}
										<div className="flex items-center gap-2">
											<Switch
												id={`active-${shift.id}`}
												checked={shift.isActive}
												disabled={busy}
												onCheckedChange={(checked) =>
													handleUpdateShift(shift.id, {
														isActive: checked,
													})
												}
											/>
											<Label htmlFor={`active-${shift.id}`} className="text-xs">
												Active
											</Label>
										</div>

										{/* Notes */}
										<div>
											<Label className="text-[10px]">Notes</Label>
											<Input
												value={shift.notes ?? ''}
												className="h-8 text-xs"
												disabled={busy}
												placeholder="Optional"
												onChange={(e) =>
													handleUpdateShift(shift.id, {
														notes: e.target.value,
													})
												}
											/>
										</div>
									</Card>
								)
							})}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
