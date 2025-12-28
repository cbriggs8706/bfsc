'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHead,
	TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export type Purpose = {
	id: number
	name: string
	isActive: boolean
	sortOrder: number
}

type Props = {
	initialPurposes: Purpose[]
}

export function VisitPurposes({ initialPurposes }: Props) {
	const [purposes, setPurposes] = useState<Purpose[]>(initialPurposes)
	const [newName, setNewName] = useState('')
	const [loading, setLoading] = useState(false)

	const reload = async () => {
		const res = await fetch('/api/admin/kiosk/purposes')
		const data = await res.json()
		setPurposes(data.purposes)
	}

	// Create
	const handleCreate = async () => {
		if (!newName.trim()) return

		setLoading(true)
		await fetch('/api/admin/kiosk/purposes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newName }),
		})

		setNewName('')
		await reload()
		setLoading(false)
	}

	// Update
	const updatePurpose = async (
		id: number,
		update: Partial<Pick<Purpose, 'name' | 'isActive' | 'sortOrder'>>
	) => {
		setLoading(true)
		await fetch(`/api/admin/kiosk/purposes/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		})
		await reload()
		setLoading(false)
	}

	// Delete
	const deletePurpose = async (id: number) => {
		if (!confirm('Delete this purpose?')) return

		setLoading(true)
		await fetch(`/api/admin/kiosk/purposes/${id}`, {
			method: 'DELETE',
		})
		await reload()
		setLoading(false)
	}

	return (
		<div className="space-y-6">
			{/* Create */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div className="flex-1">
					<Label>Name</Label>
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="e.g., Research Help"
					/>
				</div>
				<Button onClick={handleCreate} disabled={loading}>
					Add
				</Button>
			</div>

			{/* ========================= */}
			{/* Mobile view (cards) */}
			{/* ========================= */}
			<div className="space-y-3 md:hidden">
				{purposes.map((p) => (
					<div key={p.id} className="border rounded-lg p-3 space-y-3">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-sm">Visit Purpose</span>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => deletePurpose(p.id)}
							>
								Delete
							</Button>
						</div>

						<div>
							<Label className="text-xs">Name</Label>
							<Input
								value={p.name}
								onChange={(e) => updatePurpose(p.id, { name: e.target.value })}
							/>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex-1">
								<Label className="text-xs">Sort Order</Label>
								<Input
									type="number"
									value={p.sortOrder ?? 0}
									onChange={(e) =>
										updatePurpose(p.id, {
											sortOrder: Number(e.target.value),
										})
									}
								/>
							</div>

							<div className="flex items-center gap-2 pt-5">
								<Switch
									checked={p.isActive}
									onCheckedChange={(value) =>
										updatePurpose(p.id, { isActive: value })
									}
								/>
								<Label className="text-xs">Active</Label>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* ========================= */}
			{/* Desktop view (table) */}
			{/* ========================= */}
			<div className="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-24">Sort</TableHead>
							<TableHead>Name</TableHead>
							<TableHead className="w-24">Active</TableHead>
							<TableHead className="text-right w-32">Actions</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{purposes.map((p) => (
							<TableRow key={p.id}>
								<TableCell>
									<Input
										type="number"
										className="w-20"
										value={p.sortOrder ?? 0}
										onChange={(e) =>
											updatePurpose(p.id, {
												sortOrder: Number(e.target.value),
											})
										}
									/>
								</TableCell>

								<TableCell>
									<Input
										value={p.name}
										onChange={(e) =>
											updatePurpose(p.id, { name: e.target.value })
										}
									/>
								</TableCell>

								<TableCell>
									<Switch
										checked={p.isActive}
										onCheckedChange={(value) =>
											updatePurpose(p.id, { isActive: value })
										}
									/>
								</TableCell>

								<TableCell className="text-right">
									<Button
										variant="destructive"
										size="sm"
										onClick={() => deletePurpose(p.id)}
									>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
