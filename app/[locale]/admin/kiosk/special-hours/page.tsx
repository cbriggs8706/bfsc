// app/[locale]/admin/kiosk/special-hours/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SpecialHour = {
	id: string
	date: string
	isClosed: boolean
	reason?: string | null
	opensAt: string | null
	closesAt: string | null
}

export default function SpecialHoursAdmin() {
	const [items, setItems] = useState<SpecialHour[]>([])
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [reason, setReason] = useState('')

	const load = async () => {
		const res = await fetch('/api/admin/kiosk/special-hours')
		const data = await res.json()
		setItems(data.hours)
	}

	useEffect(() => {
		;(async () => load())()
	}, [])

	const addClosedRange = async () => {
		if (!startDate) return

		await fetch('/api/admin/kiosk/special-hours', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				startDate,
				endDate: endDate || null,
				reason: reason || null,
			}),
		})

		setStartDate('')
		setEndDate('')
		setReason('')
		load()
	}

	const deleteItem = async (id: string) => {
		await fetch(`/api/admin/kiosk/special-hours/${id}`, { method: 'DELETE' })
		load()
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Closed Days & Special Hours</h1>
				<p className="text-sm text-muted-foreground">Lorem ipsum</p>
			</div>
			<Card className="w-full">
				<CardContent className="space-y-6">
					{/* Add date range */}
					<div className="space-y-3">
						<Label>Start Date</Label>
						<Input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
						/>

						<Label>End Date (optional)</Label>
						<Input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
						/>

						<Label>Reason (optional)</Label>
						<Input
							type="text"
							placeholder="Thanksgiving Break, Cleaning, etc."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>

						<Button className="w-full" onClick={addClosedRange}>
							Add Closure
						</Button>
					</div>

					{/* List of closures */}
					<div className="space-y-2">
						{items.map((i) => (
							<div
								key={i.id}
								className="flex justify-between items-center border p-2 rounded"
							>
								<div>
									<div className="font-semibold">
										{i.date} {i.isClosed && '(Closed)'}
									</div>

									{i.reason && (
										<div className="text-sm italic text-muted-foreground">
											{i.reason}
										</div>
									)}

									{!i.isClosed && (i.opensAt || i.closesAt) && (
										<div className="text-sm text-muted-foreground">
											{`Open ${i.opensAt} – ${i.closesAt}`}
										</div>
									)}
								</div>

								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteItem(i.id)}
								>
									Delete
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
