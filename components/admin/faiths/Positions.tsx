// components/admin/faiths/Positions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	createPosition,
	updatePosition,
	deletePosition,
} from '@/app/actions/faiths'
import type { Position } from '@/types/faiths'

export function PositionsManager({
	initialPositions,
}: {
	initialPositions: Position[]
}) {
	const [positions, setPositions] = useState<Position[]>(initialPositions)
	const [newPosition, setNewPosition] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	return (
		<div className="space-y-4 max-w-lg">
			{/* Add position */}
			<div className="flex gap-2">
				<Input
					placeholder="New position name"
					value={newPosition}
					onChange={(e) => setNewPosition(e.target.value)}
				/>
				<Button
					disabled={isSaving}
					onClick={async () => {
						if (!newPosition.trim() || isSaving) return

						setIsSaving(true)

						const optimistic: Position = {
							id: crypto.randomUUID(),
							name: newPosition,
						}

						setPositions((prev) => [...prev, optimistic])
						setNewPosition('')

						try {
							await createPosition(optimistic.name)
						} catch {
							// rollback
							setPositions((prev) => prev.filter((p) => p.id !== optimistic.id))
						} finally {
							setIsSaving(false)
						}
					}}
				>
					{isSaving ? 'Saving…' : 'Add'}
				</Button>
			</div>

			{/* Existing positions */}
			<div className="space-y-2">
				{positions.map((position) => (
					<PositionRow
						key={position.id}
						position={position}
						onDelete={() =>
							setPositions((prev) => prev.filter((p) => p.id !== position.id))
						}
					/>
				))}
			</div>
		</div>
	)
}

function PositionRow({
	position,
	onDelete,
}: {
	position: Position
	onDelete: () => void
}) {
	const [name, setName] = useState(position.name)

	return (
		<div className="flex gap-2 items-center">
			<Input
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={() => {
					if (name !== position.name) {
						updatePosition(position.id, name)
					}
				}}
			/>

			<Button
				size="sm"
				variant="destructive"
				onClick={async () => {
					onDelete()
					await deletePosition(position.id)
				}}
			>
				Delete
			</Button>
		</div>
	)
}
