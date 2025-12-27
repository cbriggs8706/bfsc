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
			<div className="flex items-end gap-3">
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

			{/* Table */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Sort</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Active</TableHead>
						<TableHead className="text-right">Actions</TableHead>
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
	)
}
