// app/[locale]/admin/kiosk/purposes/page.tsx
'use client'

import { useEffect, useState } from 'react'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type Purpose = {
	id: number
	name: string
	isActive: boolean
	sortOrder: number
}

export default function AdminPurposesPage() {
	const [purposes, setPurposes] = useState<Purpose[]>([])
	const [newName, setNewName] = useState('')
	const [loading, setLoading] = useState(false)

	// Fetch purposes
	const load = async () => {
		const res = await fetch('/api/admin/kiosk/purposes')
		const data = await res.json()
		setPurposes(data.purposes)
	}

	useEffect(() => {
		;(async () => {
			const res = await fetch('/api/admin/kiosk/purposes')
			const data = await res.json()
			setPurposes(data.purposes)
		})()
	}, [])

	// Create
	const handleCreate = async () => {
		if (!newName.trim()) return

		setLoading(true)
		await fetch('/api/admin/kiosk/purposes', {
			method: 'POST',
			body: JSON.stringify({ name: newName }),
		})
		setNewName('')
		await load()
		setLoading(false)
	}

	// Update
	// const updatePurpose = async (id, update) => {
	const updatePurpose = async (
		id: number,
		update: Partial<{ name: string; isActive: boolean; sortOrder: number }>
	) => {
		setLoading(true)
		await fetch(`/api/admin/kiosk/purposes/${id}`, {
			method: 'PUT',
			body: JSON.stringify(update),
		})
		await load()
		setLoading(false)
	}

	// Delete
	const deletePurpose = async (id: number) => {
		if (!confirm('Delete this purpose?')) return
		setLoading(true)
		await fetch(`/api/admin/kiosk/purposes/${id}`, {
			method: 'DELETE',
		})
		await load()
		setLoading(false)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Define Visit Purposes</h1>
				<p className="text-sm text-muted-foreground">
					These will show up in the kiosk when a patron signs in.
				</p>
			</div>
			<Card className="w-full">
				<CardContent className="space-y-6">
					{/* Create New Purpose */}
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
									{/* Sort order */}
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

									{/* Editable name */}
									<TableCell>
										<Input
											value={p.name}
											onChange={(e) =>
												updatePurpose(p.id, { name: e.target.value })
											}
										/>
									</TableCell>

									{/* Active toggle */}
									<TableCell>
										<Switch
											checked={p.isActive}
											onCheckedChange={(value) =>
												updatePurpose(p.id, { isActive: value })
											}
										/>
									</TableCell>

									{/* Delete */}
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
				</CardContent>
			</Card>
		</div>
	)
}
