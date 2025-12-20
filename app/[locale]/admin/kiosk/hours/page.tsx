// app/[locale]/admin/kiosk/hours/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type DayRow = {
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

export default function KioskHoursAdmin() {
	const [rows, setRows] = useState<DayRow[]>([])
	const [loading, setLoading] = useState(false)
	const [drafts, setDrafts] = useState<Record<string, Partial<DayRow>>>({})

	const load = async () => {
		const res = await fetch('/api/admin/kiosk/hours')
		const data = await res.json()
		setRows(data.hours)
	}

	const getValue = <K extends keyof DayRow>(row: DayRow, key: K): DayRow[K] => {
		return (drafts[row.id]?.[key] ?? row[key]) as DayRow[K]
	}

	const updateDraft = (id: string, update: Partial<DayRow>) => {
		setDrafts((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				...update,
			},
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

		await load()

		setDrafts((prev) => {
			const copy = { ...prev }
			delete copy[id]
			return copy
		})

		setLoading(false)
	}

	useEffect(() => {
		let isMounted = true

		;(async () => {
			const res = await fetch('/api/admin/kiosk/hours')
			const data = await res.json()
			if (isMounted) {
				setRows(data.hours)
			}
		})()

		return () => {
			isMounted = false
		}
	}, [])

	const updateRow = async (id: string, update: Partial<DayRow>) => {
		setLoading(true)
		await fetch(`/api/admin/kiosk/hours/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		})
		await load()
		setLoading(false)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Define Regular Center Hours</h1>
				<p className="text-sm text-muted-foreground">
					This is used extensively throughout the site. Be careful making edits.
					Autosaves with each change you make.
				</p>
			</div>
			<Card className="w-full">
				<CardContent className="space-y-6">
					{rows.map((r) => (
						<div
							key={r.id}
							className="flex items-center justify-between gap-4 border-b pb-3"
						>
							<div className="w-32 font-semibold">
								{weekdayNames[r.weekday]}
							</div>

							{/* Closed Toggle */}
							<div className="flex items-center gap-2">
								<Switch
									checked={r.isClosed}
									onCheckedChange={(v) => updateRow(r.id, { isClosed: v })}
								/>
								<Label>Closed</Label>
							</div>

							{/* Time Inputs */}
							{!r.isClosed && (
								<>
									<Input
										type="time"
										className="w-28"
										value={getValue(r, 'opensAt')}
										onChange={(e) =>
											updateDraft(r.id, { opensAt: e.target.value })
										}
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

					<Button disabled={loading} onClick={load} className="w-full">
						Refresh
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
