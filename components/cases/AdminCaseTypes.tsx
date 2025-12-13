'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { createCaseType } from '@/app/actions/cases/create-case-type'
import { updateCaseType } from '@/app/actions/cases/update-case-type'

type CaseType = {
	id: string
	name: string
	icon?: string | null
	isActive: boolean
}

export function AdminCaseTypes({ initialTypes }: { initialTypes: CaseType[] }) {
	const [types, setTypes] = useState(initialTypes)
	const [name, setName] = useState('')
	const [icon, setIcon] = useState('')

	async function handleCreate() {
		if (!name.trim()) return

		const created = await createCaseType({ name, icon })
		setTypes((t) => [...t, created])
		setName('')
		setIcon('')
	}

	async function toggleActive(type: CaseType) {
		await updateCaseType(type.id, {
			name: type.name,
			icon: type.icon ?? undefined,
			isActive: !type.isActive,
		})

		setTypes((t) =>
			t.map((x) => (x.id === type.id ? { ...x, isActive: !x.isActive } : x))
		)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-xl font-bold">Case Types</h1>

			<Card className="p-4 space-y-3">
				<h2 className="font-semibold">Add Case Type</h2>

				<Input
					placeholder="Name (e.g. Photo Identification)"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<Input
					placeholder="Icon (emoji or text)"
					value={icon}
					onChange={(e) => setIcon(e.target.value)}
				/>

				<Button onClick={handleCreate}>Add</Button>
			</Card>

			<div className="space-y-3">
				{types.map((t) => (
					<Card key={t.id} className="p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="text-lg">{t.icon}</span>
							<span className="font-medium">{t.name}</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								{t.isActive ? 'Active' : 'Disabled'}
							</span>
							<Switch
								checked={t.isActive}
								onCheckedChange={() => toggleActive(t)}
							/>
						</div>
					</Card>
				))}
			</div>
		</div>
	)
}
