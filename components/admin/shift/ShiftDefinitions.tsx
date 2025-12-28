// components/admin/shift/ShiftDefinitions.tsx
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
import { Day, Recurrence, Shift } from '@/types/shifts'
import { toast } from 'sonner'

type Props = {
	days: Day[]
	shifts: Shift[]
}

export function ShiftDefinitionsManager({ days, shifts }: Props) {
	const [localShifts, setLocalShifts] = useState<Shift[]>(shifts)
	const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
	const [drafts, setDrafts] = useState<Record<string, Partial<Shift>>>({})

	const getValue = <K extends keyof Shift>(shift: Shift, key: K): Shift[K] => {
		return (drafts[shift.id]?.[key] ?? shift[key]) as Shift[K]
	}

	const updateDraft = (shiftId: string, updates: Partial<Shift>) => {
		setDrafts((prev) => ({
			...prev,
			[shiftId]: {
				...prev[shiftId],
				...updates,
			},
		}))

		setLocalShifts((prev) =>
			prev.map((s) => (s.id === shiftId ? { ...s, ...updates } : s))
		)
	}

	const saveDraft = async (shiftId: string) => {
		const update = drafts[shiftId]
		if (!update || Object.keys(update).length === 0) return

		setLoading(shiftId, true)

		try {
			const res = await fetch('/api/shifts/definitions', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: shiftId, ...update }),
			})

			if (!res.ok) throw new Error('Failed to update shift')

			setDrafts((prev) => {
				const copy = { ...prev }
				delete copy[shiftId]
				return copy
			})
		} catch (err) {
			console.error(err)
		} finally {
			setLoading(shiftId, false)
		}
	}

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
			recurrences: [
				{
					id: 'temp',
					label: 'Every week',
					weekOfMonth: null,
					isActive: true,
					sortOrder: 0,
				},
			],
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
	// Recurrences
	// ======================================================

	const addRecurrence = async (shiftId: string) => {
		const res = await fetch('/api/shifts/recurrences', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ shiftId }),
		})

		const recurrence = await res.json()

		setLocalShifts((prev) =>
			prev.map((s) =>
				s.id === shiftId
					? { ...s, recurrences: [...s.recurrences, recurrence] }
					: s
			)
		)
	}

	const updateRecurrence = async (
		recurrenceId: string,
		updates: Partial<Recurrence>
	) => {
		setLocalShifts((prev) =>
			prev.map((s) => ({
				...s,
				recurrences: s.recurrences.map((r) =>
					r.id === recurrenceId ? { ...r, ...updates } : r
				),
			}))
		)

		await fetch('/api/shifts/recurrences', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: recurrenceId, ...updates }),
		})
	}

	const deleteRecurrence = async (shiftId: string, recurrenceId: string) => {
		const shift = localShifts.find((s) => s.id === shiftId)
		if (!shift) return

		// Remove locally first
		const remaining = shift.recurrences.filter((r) => r.id !== recurrenceId)

		// Case: deleting last recurrence → auto-recreate
		if (remaining.length === 0) {
			toast.info('Recreated "Every week" recurrence')

			// Optimistic local recreate
			const tempId = `temp-every-${Date.now()}`

			setLocalShifts((prev) =>
				prev.map((s) =>
					s.id === shiftId
						? {
								...s,
								recurrences: [
									{
										id: tempId,
										label: 'Every week',
										weekOfMonth: null,
										isActive: true,
										sortOrder: 0,
									},
								],
						  }
						: s
				)
			)

			// Delete old recurrence
			await fetch('/api/shifts/recurrences', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: recurrenceId }),
			})

			// Create replacement on server
			const res = await fetch('/api/shifts/recurrences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					shiftId,
					label: 'Every week',
					weekOfMonth: null,
					sortOrder: 0,
				}),
			})

			const created = await res.json()

			// Swap temp ID
			setLocalShifts((prev) =>
				prev.map((s) =>
					s.id === shiftId
						? {
								...s,
								recurrences: s.recurrences.map((r) =>
									r.id === tempId ? created : r
								),
						  }
						: s
				)
			)

			return
		}

		// Normal delete
		setLocalShifts((prev) =>
			prev.map((s) => (s.id === shiftId ? { ...s, recurrences: remaining } : s))
		)

		await fetch('/api/shifts/recurrences', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: recurrenceId }),
		})
	}

	// ======================================================
	// UI
	// ======================================================

	return (
		<div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
			{days.map((day) => {
				const dayShifts = localShifts
					.filter((s) => s.weekday === day.weekday)
					.sort((a, b) => a.startTime.localeCompare(b.startTime))

				return (
					<Card key={day.weekday}>
						<CardHeader className="flex items-start justify-between gap-3 sm:flex-row sm:items-center">
							<div className="flex flex-col">
								<span className="font-semibold text-xl">{day.label}</span>
								<span className="text-[13px] text-muted-foreground">
									Center open {toAmPm(day.opensAt)}–{toAmPm(day.closesAt)}
								</span>
							</div>

							<Button
								size="icon"
								variant="outline"
								className="h-8 w-8"
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
											'border rounded-lg p-3 sm:p-4 space-y-3',
											!shift.isActive && 'opacity-50'
										)}
									>
										{/* Shift Header */}
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="font-semibold text-sm">
												{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
											</div>

											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-destructive self-end sm:self-auto"
												disabled={busy}
												onClick={() => handleDeleteShift(shift.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>

										{/* Start / End Inputs */}
										<div className="grid gap-3 sm:grid-cols-2">
											<div>
												<Label className="text-[10px]">Start</Label>
												<Input
													type="time"
													value={getValue(shift, 'startTime')}
													className="h-8 text-xs"
													disabled={busy}
													onChange={(e) =>
														updateDraft(shift.id, {
															startTime: e.target.value,
														})
													}
													onBlur={() => saveDraft(shift.id)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') e.currentTarget.blur()
													}}
												/>
											</div>

											<div>
												<Label className="text-[10px]">End</Label>
												<Input
													type="time"
													value={getValue(shift, 'endTime')}
													className="h-8 text-xs"
													disabled={busy}
													onChange={(e) =>
														updateDraft(shift.id, {
															endTime: e.target.value,
														})
													}
													onBlur={() => saveDraft(shift.id)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') e.currentTarget.blur()
													}}
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
													handleUpdateShift(shift.id, { isActive: checked })
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
												value={getValue(shift, 'notes') ?? ''}
												className="h-8 text-xs"
												disabled={busy}
												placeholder="Optional"
												onChange={(e) =>
													updateDraft(shift.id, { notes: e.target.value })
												}
												onBlur={() => saveDraft(shift.id)}
												onKeyDown={(e) => {
													if (e.key === 'Enter') e.currentTarget.blur()
												}}
											/>
										</div>

										{/* Recurrences */}
										<div className="space-y-2 pt-2 border-t">
											<div className="flex items-center justify-between">
												<span className="text-xs font-semibold">
													Recurrences
												</span>

												<Button
													size="sm"
													variant="outline"
													onClick={() => addRecurrence(shift.id)}
												>
													<Plus className="h-3 w-3 mr-1" />
													Add
												</Button>
											</div>

											{shift.recurrences.map((r) => (
												<div
													key={r.id}
													className="flex flex-col gap-2 sm:flex-row sm:items-center text-xs"
												>
													<Input
														className="sm:w-40"
														value={r.label}
														onChange={(e) =>
															setLocalShifts((prev) =>
																prev.map((s) => ({
																	...s,
																	recurrences: s.recurrences.map((rec) =>
																		rec.id === r.id
																			? {
																					...rec,
																					label: e.target.value,
																			  }
																			: rec
																	),
																}))
															)
														}
														onBlur={(e) =>
															updateRecurrence(r.id, {
																label: e.target.value,
															})
														}
													/>

													<Input
														type="number"
														min={1}
														max={5}
														className="sm:w-20"
														placeholder="Week"
														value={r.weekOfMonth ?? ''}
														onChange={(e) =>
															setLocalShifts((prev) =>
																prev.map((s) => ({
																	...s,
																	recurrences: s.recurrences.map((rec) =>
																		rec.id === r.id
																			? {
																					...rec,
																					weekOfMonth: e.target.value
																						? Number(e.target.value)
																						: null,
																			  }
																			: rec
																	),
																}))
															)
														}
														onBlur={(e) =>
															updateRecurrence(r.id, {
																weekOfMonth: e.target.value
																	? Number(e.target.value)
																	: null,
															})
														}
													/>

													<Button
														size="icon"
														variant="ghost"
														className="h-7 w-7 text-destructive self-end sm:self-auto"
														onClick={() => deleteRecurrence(shift.id, r.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
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
