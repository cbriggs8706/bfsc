//components/admin/hours/CenterHoursForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export type DayRow = {
	id: string
	weekday: number
	opensAt: string
	closesAt: string
	isClosed: boolean
}

const weekdayNames = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

type Props = {
	initialRows: DayRow[]
}

export function CenterHoursForm({ initialRows }: Props) {
	const [rows, setRows] = useState<DayRow[]>(initialRows)
	const [loading, setLoading] = useState(false)
	const [drafts, setDrafts] = useState<Record<string, Partial<DayRow>>>({})

	const reload = async () => {
		const res = await fetch('/api/admin/kiosk/hours')
		const data = await res.json()
		setRows(data.hours)
	}

	const getValue = <K extends keyof DayRow>(row: DayRow, key: K): DayRow[K] =>
		(drafts[row.id]?.[key] ?? row[key]) as DayRow[K]

	const updateDraft = (id: string, update: Partial<DayRow>) => {
		setDrafts((prev) => ({
			...prev,
			[id]: { ...prev[id], ...update },
		}))
	}

	const saveDraft = async (id: string) => {
		const update = drafts[id]
		if (!update || Object.keys(update).length === 0) return

		setLoading(true)

		await fetch(`/api/admin/kiosk/hours/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		})

		await reload()

		setDrafts((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})

		setLoading(false)
	}

	const updateRow = async (id: string, update: Partial<DayRow>) => {
		setLoading(true)

		await fetch(`/api/admin/kiosk/hours/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		})

		await reload()
		setLoading(false)
	}

	return (
		<div className="space-y-6">
			{rows.map((r) => (
				<div
					key={r.id}
					className="rounded-md border p-4 md:p-0 md:border-0 md:border-b md:pb-3"
				>
					<div className="grid gap-3 md:grid-cols-[120px_auto_1fr_1fr] md:items-center">
						{/* Day */}
						<div className="font-semibold md:w-32">
							{weekdayNames[r.weekday]}
						</div>

						{/* Closed toggle */}
						<div className="flex items-center gap-2">
							<Switch
								checked={r.isClosed}
								onCheckedChange={(v) => updateRow(r.id, { isClosed: v })}
							/>
							<Label>Closed</Label>
						</div>

						{/* Time inputs */}
						{!r.isClosed ? (
							<>
								<div className="flex items-center gap-2">
									<Label className="w-14 md:hidden">Open</Label>
									<Input
										type="time"
										value={getValue(r, 'opensAt')}
										onChange={(e) =>
											updateDraft(r.id, { opensAt: e.target.value })
										}
										onBlur={() => saveDraft(r.id)}
									/>
								</div>

								<div className="flex items-center gap-2">
									<Label className="w-14 md:hidden">Close</Label>
									<Input
										type="time"
										value={getValue(r, 'closesAt')}
										onChange={(e) =>
											updateDraft(r.id, { closesAt: e.target.value })
										}
										onBlur={() => saveDraft(r.id)}
									/>
								</div>
							</>
						) : (
							<div className="text-sm text-muted-foreground md:col-span-2">
								Closed all day
							</div>
						)}
					</div>
				</div>
			))}

			<Button disabled={loading} onClick={reload} className="w-full">
				Save & Refresh
			</Button>
		</div>
	)
}
