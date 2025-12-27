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
					className="flex items-center justify-between gap-4 border-b pb-3"
				>
					<div className="w-32 font-semibold">{weekdayNames[r.weekday]}</div>

					{/* Closed toggle */}
					<div className="flex items-center gap-2">
						<Switch
							checked={r.isClosed}
							onCheckedChange={(v) => updateRow(r.id, { isClosed: v })}
						/>
						<Label>Closed</Label>
					</div>

					{/* Time inputs */}
					{!r.isClosed && (
						<>
							<Input
								type="time"
								className="w-28"
								value={getValue(r, 'opensAt')}
								onChange={(e) => updateDraft(r.id, { opensAt: e.target.value })}
								onBlur={() => saveDraft(r.id)}
							/>
							<Input
								type="time"
								className="w-28"
								value={getValue(r, 'closesAt')}
								onChange={(e) =>
									updateDraft(r.id, { closesAt: e.target.value })
								}
								onBlur={() => saveDraft(r.id)}
							/>
						</>
					)}
				</div>
			))}

			<Button disabled={loading} onClick={reload} className="w-full">
				Save & Refresh
			</Button>
		</div>
	)
}
