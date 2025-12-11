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

	const load = async () => {
		const res = await fetch('/api/admin/kiosk/hours')
		const data = await res.json()
		setRows(data.hours)
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
		<Card className="w-full max-w-3xl mx-auto mt-10">
			<CardHeader>
				<CardTitle>Kiosk Weekly Hours</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{rows.map((r) => (
					<div
						key={r.id}
						className="flex items-center justify-between gap-4 border-b pb-3"
					>
						<div className="w-32 font-semibold">{weekdayNames[r.weekday]}</div>

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
									value={r.opensAt}
									onChange={(e) => updateRow(r.id, { opensAt: e.target.value })}
								/>
								<Input
									type="time"
									className="w-28"
									value={r.closesAt}
									onChange={(e) =>
										updateRow(r.id, { closesAt: e.target.value })
									}
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
	)
}
