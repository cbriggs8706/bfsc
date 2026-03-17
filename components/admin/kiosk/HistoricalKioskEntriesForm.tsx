'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Trash2, UserRoundCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchPerson = {
	id: string
	fullName: string
	userId: string | null
	isWorker: boolean
	hasPasscode: boolean
	source: 'kiosk' | 'user'
}

type Faith = { id: string; name: string }
type WardGroup = {
	stakeId: string
	stakeName: string
	wards: { id: string; name: string }[]
}

type EntryRow = {
	id: string
	time: string
	name: string
	onShift: boolean
	selectedPerson: SearchPerson | null
}

const INITIAL_ROWS = 15

function createEmptyRow(): EntryRow {
	return {
		id: crypto.randomUUID(),
		time: '',
		name: '',
		onShift: false,
		selectedPerson: null,
	}
}

function createInitialRows() {
	return Array.from({ length: INITIAL_ROWS }, () => createEmptyRow())
}

function isMissionariesName(value: string | null | undefined) {
	return value?.trim().toLowerCase() === 'missionaries'
}

export function HistoricalKioskEntriesForm({
	timeZone,
}: {
	timeZone: string
}) {
	const today = useMemo(() => {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).formatToParts(new Date())

		const year = parts.find((part) => part.type === 'year')?.value ?? ''
		const month = parts.find((part) => part.type === 'month')?.value ?? ''
		const day = parts.find((part) => part.type === 'day')?.value ?? ''

		return `${year}-${month}-${day}`
	}, [timeZone])

	const [date, setDate] = useState(today)
	const [rows, setRows] = useState<EntryRow[]>(() => createInitialRows())
	const [activeRowId, setActiveRowId] = useState<string | null>(null)
	const [suggestions, setSuggestions] = useState<SearchPerson[]>([])
	const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
		useState(0)
	const [searching, setSearching] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const activeRequest = useRef<AbortController | null>(null)

	const [groupEntryOpen, setGroupEntryOpen] = useState(false)
	const [groupTime, setGroupTime] = useState('')
	const [groupName, setGroupName] = useState('')
	const [groupSelectedPerson, setGroupSelectedPerson] =
		useState<SearchPerson | null>(null)
	const [groupSuggestions, setGroupSuggestions] = useState<SearchPerson[]>([])
	const [groupHighlightedSuggestionIndex, setGroupHighlightedSuggestionIndex] =
		useState(0)
	const [groupSearching, setGroupSearching] = useState(false)
	const groupActiveRequest = useRef<AbortController | null>(null)
	const [groupSubmitting, setGroupSubmitting] = useState(false)
	const [partOfFaithGroup, setPartOfFaithGroup] = useState<boolean | null>(null)
	const [faiths, setFaiths] = useState<Faith[]>([])
	const [faithId, setFaithId] = useState('')
	const [wardGroups, setWardGroups] = useState<WardGroup[]>([])
	const [wardId, setWardId] = useState('')
	const [attendeeCountInput, setAttendeeCountInput] = useState('0')

	const activeRow = rows.find((row) => row.id === activeRowId) ?? null
	const missionariesEntry = isMissionariesName(groupSelectedPerson?.fullName ?? groupName)
	const selectedFaith = faiths.find((faith) => faith.id === faithId) ?? null
	const isLdsFaith =
		selectedFaith?.name.toLowerCase().includes('latter-day saints') ?? false
	const attendeeCount = Number.isFinite(Number(attendeeCountInput))
		? Math.max(0, Math.floor(Number(attendeeCountInput)))
		: 0
	const selectedWardGroup =
		wardGroups.find((group) => group.wards.some((ward) => ward.id === wardId)) ?? null
	const selectedWard =
		selectedWardGroup?.wards.find((ward) => ward.id === wardId) ?? null

	useEffect(() => {
		if (!activeRow || activeRow.selectedPerson || activeRow.name.trim().length < 2) {
			setSuggestions([])
			setHighlightedSuggestionIndex(0)
			setSearching(false)
			activeRequest.current?.abort()
			return
		}

		const controller = new AbortController()
		activeRequest.current?.abort()
		activeRequest.current = controller

		setSearching(true)
		const timeoutId = window.setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/kiosk/search?q=${encodeURIComponent(activeRow.name.trim())}`,
					{ signal: controller.signal }
				)
				if (!res.ok) throw new Error('Search failed')
				const data = (await res.json()) as { people?: SearchPerson[] }
				setSuggestions(data.people ?? [])
				setHighlightedSuggestionIndex(0)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setSuggestions([])
					setHighlightedSuggestionIndex(0)
				}
			} finally {
				setSearching(false)
			}
		}, 200)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [activeRow])

	useEffect(() => {
		if (!groupEntryOpen || groupSelectedPerson || groupName.trim().length < 2) {
			setGroupSuggestions([])
			setGroupHighlightedSuggestionIndex(0)
			setGroupSearching(false)
			groupActiveRequest.current?.abort()
			return
		}

		const controller = new AbortController()
		groupActiveRequest.current?.abort()
		groupActiveRequest.current = controller

		setGroupSearching(true)
		const timeoutId = window.setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/kiosk/search?q=${encodeURIComponent(groupName.trim())}`,
					{ signal: controller.signal }
				)
				if (!res.ok) throw new Error('Search failed')
				const data = (await res.json()) as { people?: SearchPerson[] }
				setGroupSuggestions(data.people ?? [])
				setGroupHighlightedSuggestionIndex(0)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setGroupSuggestions([])
					setGroupHighlightedSuggestionIndex(0)
				}
			} finally {
				setGroupSearching(false)
			}
		}, 200)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [groupEntryOpen, groupName, groupSelectedPerson])

	const filledRows = rows.filter((row) => row.time.trim() && row.name.trim())
	const hasPartialRow = rows.some(
		(row) =>
			(row.time.trim() && !row.name.trim()) || (!row.time.trim() && row.name.trim())
	)

	const updateRow = (rowId: string, patch: Partial<EntryRow>) => {
		setRows((current) =>
			current.map((row) => {
				if (row.id !== rowId) return row

				const nextRow = { ...row, ...patch }
				if (typeof patch.name === 'string') {
					nextRow.selectedPerson =
						row.selectedPerson &&
						patch.name.trim() === row.selectedPerson.fullName
							? row.selectedPerson
							: null
				}
				return nextRow
			})
		)
	}

	const selectPerson = (rowId: string, person: SearchPerson) => {
		setRows((current) =>
			current.map((row) =>
				row.id === rowId
					? {
							...row,
							name: person.fullName,
							selectedPerson: person,
						}
					: row
			)
		)
		setSuggestions([])
		setHighlightedSuggestionIndex(0)
	}

	const selectGroupPerson = (person: SearchPerson) => {
		if (isMissionariesName(person.fullName)) {
			setPartOfFaithGroup(null)
			setFaithId('')
			setWardId('')
			setWardGroups([])
		}
		setGroupName(person.fullName)
		setGroupSelectedPerson(person)
		setGroupSuggestions([])
		setGroupHighlightedSuggestionIndex(0)
	}

	const addRow = () => {
		setRows((current) => [...current, createEmptyRow()])
	}

	const removeRow = (rowId: string) => {
		setRows((current) => {
			if (current.length === 1) return [createEmptyRow()]
			return current.filter((row) => row.id !== rowId)
		})
		if (activeRowId === rowId) {
			setActiveRowId(null)
			setSuggestions([])
			setHighlightedSuggestionIndex(0)
		}
	}

	const moveHighlight = (direction: 1 | -1) => {
		if (suggestions.length === 0) return

		setHighlightedSuggestionIndex((current) => {
			const next = current + direction
			if (next < 0) return suggestions.length - 1
			if (next >= suggestions.length) return 0
			return next
		})
	}

	const moveGroupHighlight = (direction: 1 | -1) => {
		if (groupSuggestions.length === 0) return

		setGroupHighlightedSuggestionIndex((current) => {
			const next = current + direction
			if (next < 0) return groupSuggestions.length - 1
			if (next >= groupSuggestions.length) return 0
			return next
		})
	}

	const loadFaiths = async () => {
		if (faiths.length > 0) return
		const res = await fetch('/api/faiths')
		if (!res.ok) throw new Error('Failed to load faith groups.')
		const data = (await res.json()) as { faiths?: Faith[] }
		setFaiths(data.faiths ?? [])
	}

	const loadLdsUnits = async (selectedFaithId: string) => {
		if (!selectedFaithId) return

		const wardsRes = await fetch(
			`/api/faiths/wards?faithId=${encodeURIComponent(selectedFaithId)}`
		)

		if (!wardsRes.ok) {
			throw new Error('Failed to load ward options.')
		}

		const wardsData = (await wardsRes.json()) as { wards?: WardGroup[] }
		setWardGroups(wardsData.wards ?? [])
	}

	const handleFaithGroupToggle = async (value: boolean) => {
		setPartOfFaithGroup(value)
		setFaithId('')
		setWardId('')
		setWardGroups([])

		if (value) {
			try {
				await loadFaiths()
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Failed to load faith groups.'
				)
			}
		}
	}

	const handleFaithSelection = async (selectedFaithId: string) => {
		setFaithId(selectedFaithId)
		setWardId('')
		setWardGroups([])

		if (!selectedFaithId) return

		const faith = faiths.find((item) => item.id === selectedFaithId)
		const ldsFaith =
			faith?.name.toLowerCase().includes('latter-day saints') ?? false
		if (!ldsFaith) return

		try {
			await loadLdsUnits(selectedFaithId)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to load ward options.'
			)
		}
	}

	const resetGroupForm = () => {
		setGroupTime('')
		setGroupName('')
		setGroupSelectedPerson(null)
		setGroupSuggestions([])
		setGroupHighlightedSuggestionIndex(0)
		setPartOfFaithGroup(null)
		setFaithId('')
		setWardId('')
		setWardGroups([])
		setAttendeeCountInput('0')
	}

	const submit = async () => {
		if (!date) {
			toast.error('Choose a date first.')
			return
		}

		if (filledRows.length === 0) {
			toast.error('Add at least one line with both a time and a name.')
			return
		}

		if (hasPartialRow) {
			toast.error('Finish or clear partial rows before saving.')
			return
		}

		setSubmitting(true)
		try {
			const res = await fetch('/api/admin/kiosk/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date,
					entries: filledRows.map((row) => ({
						time: row.time,
						name: row.name,
						onShift: row.onShift,
						selectedId: row.selectedPerson?.id ?? null,
					})),
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.error ?? 'Failed to save entries.')
			}

			toast.success(
				`Saved ${data.count} historical kiosk entr${data.count === 1 ? 'y' : 'ies'}.`
			)
			setRows(createInitialRows())
			setSuggestions([])
			setHighlightedSuggestionIndex(0)
			setActiveRowId(null)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save entries.'
			)
		} finally {
			setSubmitting(false)
		}
	}

	const submitGroupEntry = async () => {
		if (!date) {
			toast.error('Choose a date first.')
			return
		}

		if (!groupTime.trim()) {
			toast.error('Enter a time for the group visit.')
			return
		}

		if (!/^\d{2}:\d{2}$/.test(groupTime)) {
			toast.error('Use a valid time for the group visit.')
			return
		}

		if (!groupName.trim()) {
			toast.error('Enter the group or person name.')
			return
		}

		if (!missionariesEntry && partOfFaithGroup === null) {
			toast.error('Choose whether this group is part of a faith group.')
			return
		}

		if (!missionariesEntry && partOfFaithGroup && !faithId) {
			toast.error('Choose a faith group.')
			return
		}

		if (!missionariesEntry && isLdsFaith && !wardId) {
			toast.error('Choose a ward for this group.')
			return
		}

		setGroupSubmitting(true)
		try {
			const res = await fetch('/api/admin/kiosk/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date,
					entries: [
						{
							time: groupTime,
							name: groupName.trim(),
							selectedId: groupSelectedPerson?.id ?? null,
							visitMeta: {
								visitReason: 'group',
								partOfFaithGroup: missionariesEntry
									? null
									: partOfFaithGroup,
								faithGroupName:
									missionariesEntry || !partOfFaithGroup
										? null
										: selectedFaith?.name ?? null,
								stakeName:
									missionariesEntry || !partOfFaithGroup
										? null
										: selectedWardGroup?.stakeName ?? null,
								wardName:
									missionariesEntry || !partOfFaithGroup
										? null
										: selectedWard?.name ?? null,
								peopleCameWithVisitor: attendeeCount,
							},
						},
					],
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.error ?? 'Failed to save group visit.')
			}

			toast.success('Saved historical group visit.')
			resetGroupForm()
			setGroupEntryOpen(false)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save group visit.'
			)
		} finally {
			setGroupSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,var(--card)_0%,var(--green-logo-soft)_180%)] shadow-sm">
				<CardHeader className="border-b border-border/60 bg-[linear-gradient(135deg,var(--blue-accent-soft)_0%,transparent_75%)]">
					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div className="space-y-1">
							<CardTitle>Historical group visits</CardTitle>
							<CardDescription>
								Add missionaries or other group check-ins without changing your
								existing line-entry flow.
							</CardDescription>
						</div>
						<Button
							type="button"
							variant={groupEntryOpen ? 'secondary' : 'default'}
							onClick={() => {
								if (groupEntryOpen) {
									resetGroupForm()
									setGroupEntryOpen(false)
									return
								}
								setGroupEntryOpen(true)
							}}
						>
							{groupEntryOpen ? 'Close group entry' : 'Enter group visit'}
						</Button>
					</div>
				</CardHeader>
				{groupEntryOpen && (
					<CardContent className="space-y-6 pt-6">
						<div className="grid gap-4 md:grid-cols-[220px_1fr]">
							<div className="space-y-2">
								<label
									className="text-sm font-medium"
									htmlFor="historical-group-date"
								>
									Date
								</label>
								<Input
									id="historical-group-date"
									type="date"
									value={date}
									onChange={(event) => setDate(event.target.value)}
								/>
							</div>
							<div className="rounded-xl border border-border/70 bg-card/75 p-4 text-sm text-muted-foreground">
								Group visits are saved as completed historical visits in center
								time ({timeZone}) with the same group metadata the kiosk uses.
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
									Time
								</label>
								<Input
									type="time"
									value={groupTime}
									onChange={(event) => setGroupTime(event.target.value)}
								/>
							</div>

							<div className="relative space-y-2">
								<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
									Name
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={groupName}
										className="pl-9"
										placeholder="Missionaries or group name"
										onChange={(event) => {
											const nextName = event.target.value
											const currentMissionaries = isMissionariesName(
												groupSelectedPerson?.fullName ?? groupName
											)
											const nextMissionaries = isMissionariesName(nextName)
											setGroupName(nextName)
											setGroupSelectedPerson((current) =>
												current && current.fullName === nextName ? current : null
											)
											if (currentMissionaries !== nextMissionaries) {
												setPartOfFaithGroup(null)
												setFaithId('')
												setWardId('')
												setWardGroups([])
											}
										}}
										onKeyDown={(event) => {
											if (event.key === 'ArrowDown' && groupSuggestions.length > 0) {
												event.preventDefault()
												moveGroupHighlight(1)
											}

											if (event.key === 'ArrowUp' && groupSuggestions.length > 0) {
												event.preventDefault()
												moveGroupHighlight(-1)
											}

											if (event.key === 'Enter' && groupSuggestions.length > 0) {
												const person =
													groupSuggestions[groupHighlightedSuggestionIndex]
												if (person) {
													event.preventDefault()
													selectGroupPerson(person)
												}
											}

											if (event.key === 'Escape') {
												setGroupSuggestions([])
												setGroupHighlightedSuggestionIndex(0)
											}
										}}
										onBlur={() => {
											window.setTimeout(() => {
												setGroupSuggestions([])
												setGroupHighlightedSuggestionIndex(0)
											}, 150)
										}}
									/>
								</div>

								{groupSelectedPerson && (
									<div className="flex items-center gap-2 rounded-lg border border-border/70 bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
										<UserRoundCheck className="size-3.5" />
										Linked to existing{' '}
										{groupSelectedPerson.source === 'user'
											? 'user'
											: 'kiosk record'}
										{groupSelectedPerson.isWorker ? ' • worker' : ''}
									</div>
								)}

								{groupName.trim().length >= 2 && !groupSelectedPerson && (
									<div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
										{groupSearching && (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												Searching...
											</div>
										)}
										{!groupSearching &&
											groupSuggestions.map((person, suggestionIndex) => (
												<button
													key={person.id}
													type="button"
													className={cn(
														'flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent/60',
														suggestionIndex ===
															groupHighlightedSuggestionIndex &&
															'bg-accent/60'
													)}
													onMouseDown={(event) => event.preventDefault()}
													onMouseEnter={() =>
														setGroupHighlightedSuggestionIndex(suggestionIndex)
													}
													onClick={() => selectGroupPerson(person)}
												>
													<div>
														<div className="font-medium">{person.fullName}</div>
														<div className="text-xs text-muted-foreground">
															{person.source === 'user'
																? 'Existing app user'
																: 'Existing kiosk person'}
															{person.isWorker ? ' • worker' : ''}
														</div>
													</div>
													<div
														className={cn(
															'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
															person.source === 'user'
																? 'bg-[var(--green-logo-soft)] text-foreground'
																: 'bg-[var(--blue-accent-soft)] text-foreground'
														)}
													>
														{person.source}
													</div>
												</button>
											))}
										{!groupSearching && groupSuggestions.length === 0 && (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												No existing match. Saving will create a kiosk person.
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
								{missionariesEntry ? 'Missionary count' : 'Group size'}
							</label>
							<Input
								type="number"
								min={0}
								step={1}
								value={attendeeCountInput}
								onChange={(event) => {
									const nextValue = event.target.value
									if (nextValue === '') {
										setAttendeeCountInput('')
										return
									}

									if (/^\d+$/.test(nextValue)) {
										setAttendeeCountInput(nextValue)
									}
								}}
							/>
						</div>

						{!missionariesEntry && (
							<div className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4">
								<div className="space-y-2">
									<p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
										Faith group
									</p>
									<div className="grid gap-3 sm:grid-cols-2">
										<Button
											type="button"
											variant={partOfFaithGroup ? 'default' : 'outline'}
											onClick={() => void handleFaithGroupToggle(true)}
										>
											Part of a faith group
										</Button>
										<Button
											type="button"
											variant={partOfFaithGroup === false ? 'default' : 'outline'}
											onClick={() => void handleFaithGroupToggle(false)}
										>
											Not a faith group
										</Button>
									</div>
								</div>

								{partOfFaithGroup && (
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
												Faith group
											</label>
											<select
												className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
												value={faithId}
												onChange={(event) =>
													void handleFaithSelection(event.target.value)
												}
											>
												<option value="">Select faith group</option>
												{faiths.map((faith) => (
													<option key={faith.id} value={faith.id}>
														{faith.name}
													</option>
												))}
											</select>
										</div>

										{isLdsFaith && (
											<div className="space-y-2">
												<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
													Ward
												</label>
												<select
													className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
													value={wardId}
													onChange={(event) => setWardId(event.target.value)}
												>
													<option value="">Select ward</option>
													{wardGroups.map((group) => (
														<optgroup
															key={group.stakeId}
															label={group.stakeName}
														>
															{group.wards.map((ward) => (
																<option key={ward.id} value={ward.id}>
																	{ward.name}
																</option>
															))}
														</optgroup>
													))}
												</select>
												{selectedWardGroup && selectedWard && (
													<p className="text-sm text-muted-foreground">
														{selectedWard.name} • {selectedWardGroup.stakeName}
													</p>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						)}

						<div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-muted-foreground">
								Use this for missionaries or any group visit that needs size and
								ward details captured.
							</p>
							<Button
								type="button"
								onClick={submitGroupEntry}
								disabled={groupSubmitting}
							>
								{groupSubmitting ? 'Saving...' : 'Save group visit'}
							</Button>
						</div>
					</CardContent>
				)}
			</Card>

			<Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,var(--card)_0%,var(--blue-accent-soft)_180%)] shadow-sm">
				<CardHeader className="border-b border-border/60 bg-[linear-gradient(135deg,var(--green-logo-soft)_0%,transparent_75%)]">
					<CardTitle>Historical kiosk entries</CardTitle>
					<CardDescription>
						Pick one date, then enter time and name per line. Check on-shift for
						worker entries; all unchecked lines are saved as patron visits.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 pt-6">
					<div className="grid gap-4 md:grid-cols-[220px_1fr]">
						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="historical-kiosk-date"
							>
								Date
							</label>
							<Input
								id="historical-kiosk-date"
								type="date"
								value={date}
								onChange={(event) => setDate(event.target.value)}
							/>
						</div>
						<div className="rounded-xl border border-border/70 bg-card/75 p-4 text-sm text-muted-foreground">
							Entries are saved in center time ({timeZone}) and are closed
							immediately so they count historically without showing as currently
							present.
						</div>
					</div>

					<div className="space-y-3">
						{rows.map((row, index) => {
							const showSuggestionPanel =
								activeRowId === row.id &&
								row.name.trim().length >= 2 &&
								!row.selectedPerson

							return (
								<div
									key={row.id}
									className="grid gap-3 rounded-xl border border-border/70 bg-card/80 p-3 md:grid-cols-[120px_minmax(0,1fr)_120px_auto]"
								>
									<div className="space-y-2">
										<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
											Time
										</label>
										<Input
											type="time"
											value={row.time}
											onChange={(event) =>
												updateRow(row.id, { time: event.target.value })
											}
										/>
									</div>

									<div className="relative space-y-2">
										<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
											Name #{index + 1}
										</label>
										<div className="relative">
											<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												value={row.name}
												className="pl-9"
												placeholder="Start typing a patron name"
												onFocus={() => setActiveRowId(row.id)}
												onChange={(event) =>
													updateRow(row.id, { name: event.target.value })
												}
												onKeyDown={(event) => {
													if (
														event.key === 'ArrowDown' &&
														showSuggestionPanel
													) {
														event.preventDefault()
														moveHighlight(1)
													}

													if (
														event.key === 'ArrowUp' &&
														showSuggestionPanel
													) {
														event.preventDefault()
														moveHighlight(-1)
													}

													if (event.key === 'Enter' && showSuggestionPanel) {
														const person =
															suggestions[highlightedSuggestionIndex]
														if (person) {
															event.preventDefault()
															selectPerson(row.id, person)
														}
													}

													if (event.key === 'Escape' && showSuggestionPanel) {
														event.preventDefault()
														setSuggestions([])
														setHighlightedSuggestionIndex(0)
													}
												}}
												onBlur={() => {
													window.setTimeout(() => {
														setSuggestions([])
														setHighlightedSuggestionIndex(0)
														setActiveRowId((current) =>
															current === row.id ? null : current
														)
													}, 150)
												}}
											/>
										</div>

										{row.selectedPerson && (
											<div className="flex items-center gap-2 rounded-lg border border-border/70 bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
												<UserRoundCheck className="size-3.5" />
												Linked to existing{' '}
												{row.selectedPerson.source === 'user'
													? 'user'
													: 'kiosk record'}
												{row.selectedPerson.isWorker ? ' • worker' : ''}
											</div>
										)}

										{showSuggestionPanel && (
											<div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
												{searching && (
													<div className="px-3 py-2 text-sm text-muted-foreground">
														Searching...
													</div>
												)}
												{!searching &&
													suggestions.map((person, suggestionIndex) => (
														<button
															key={person.id}
															type="button"
															className={cn(
																'flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent/60',
																suggestionIndex ===
																	highlightedSuggestionIndex &&
																	'bg-accent/60'
															)}
															onMouseDown={(event) => event.preventDefault()}
															onMouseEnter={() =>
																setHighlightedSuggestionIndex(suggestionIndex)
															}
															onClick={() => selectPerson(row.id, person)}
														>
															<div>
																<div className="font-medium">
																	{person.fullName}
																</div>
																<div className="text-xs text-muted-foreground">
																	{person.source === 'user'
																		? 'Existing app user'
																		: 'Existing kiosk person'}
																	{person.isWorker ? ' • worker' : ''}
																</div>
															</div>
															<div
																className={cn(
																	'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
																	person.source === 'user'
																		? 'bg-[var(--green-logo-soft)] text-foreground'
																		: 'bg-[var(--blue-accent-soft)] text-foreground'
																)}
															>
																{person.source}
															</div>
														</button>
													))}
												{!searching && suggestions.length === 0 && (
													<div className="px-3 py-2 text-sm text-muted-foreground">
														No existing match. Saving will create a kiosk
														person.
													</div>
												)}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
											On shift
										</label>
										<div className="flex h-9 items-center rounded-md border border-border/70 bg-background px-3">
											<Checkbox
												checked={row.onShift}
												onCheckedChange={(checked) =>
													updateRow(row.id, { onShift: checked === true })
												}
												aria-label={`Mark row ${index + 1} as on shift`}
											/>
										</div>
									</div>

									<div className="flex items-end justify-end">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeRow(row.id)}
											aria-label={`Remove row ${index + 1}`}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
							)
						})}
					</div>

					<div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<Button type="button" variant="outline" onClick={addRow}>
							<Plus className="size-4" />
							Add line
						</Button>

						<div className="flex flex-col gap-2 sm:items-end">
							<p className="text-sm text-muted-foreground">
								{filledRows.length} ready to save
							</p>
							<Button type="button" onClick={submit} disabled={submitting}>
								{submitting ? 'Saving...' : 'Save historical entries'}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
