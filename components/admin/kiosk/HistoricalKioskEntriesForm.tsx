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

export function HistoricalKioskEntriesForm({
	timeZone,
}: {
	timeZone: string
}) {
	const today = useMemo(
		() => {
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
		},
		[timeZone]
	)

	const [date, setDate] = useState(today)
	const [rows, setRows] = useState<EntryRow[]>(() => createInitialRows())
	const [activeRowId, setActiveRowId] = useState<string | null>(null)
	const [suggestions, setSuggestions] = useState<SearchPerson[]>([])
	const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
		useState(0)
	const [searching, setSearching] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const activeRequest = useRef<AbortController | null>(null)

	const activeRow = rows.find((row) => row.id === activeRowId) ?? null

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

	return (
		<div className="space-y-6">
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
