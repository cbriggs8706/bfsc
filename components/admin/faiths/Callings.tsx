// components/admin/faiths/Callings.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	createCalling,
	updateCalling,
	deleteCalling,
} from '@/app/actions/faiths'
import type { Calling } from '@/types/faiths'
import { Card } from '@/components/ui/card'

export function CallingsManager({
	initialCallings,
}: {
	initialCallings: Calling[]
}) {
	const [callings, setCallings] = useState<Calling[]>(initialCallings)
	const [newCalling, setNewCalling] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	return (
		<div className="space-y-4">
			{/* Add calling */}
			<div className="flex gap-2">
				<Input
					placeholder="New calling name"
					value={newCalling}
					onChange={(e) => setNewCalling(e.target.value)}
				/>
				<Button
					disabled={isSaving}
					onClick={async () => {
						if (!newCalling.trim() || isSaving) return

						setIsSaving(true)

						const optimistic: Calling = {
							id: crypto.randomUUID(),
							name: newCalling,
						}

						setCallings((prev) => [...prev, optimistic])
						setNewCalling('')

						try {
							await createCalling(optimistic.name)
						} catch {
							// rollback
							setCallings((prev) => prev.filter((p) => p.id !== optimistic.id))
						} finally {
							setIsSaving(false)
						}
					}}
				>
					{isSaving ? 'Saving…' : 'Add'}
				</Button>
			</div>

			{/* Existing callings */}
			<Card className=" p-4">
				{callings.map((calling) => (
					<CallingRow
						key={calling.id}
						calling={calling}
						onDelete={() =>
							setCallings((prev) => prev.filter((p) => p.id !== calling.id))
						}
					/>
				))}
			</Card>
		</div>
	)
}

function CallingRow({
	calling,
	onDelete,
}: {
	calling: Calling
	onDelete: () => void
}) {
	const [name, setName] = useState(calling.name)

	return (
		<div className="flex gap-2 items-center">
			<Input
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={() => {
					if (name !== calling.name) {
						updateCalling(calling.id, name)
					}
				}}
			/>

			<Button
				size="sm"
				variant="destructive"
				onClick={async () => {
					onDelete()
					await deleteCalling(calling.id)
				}}
			>
				Delete
			</Button>
		</div>
	)
}
