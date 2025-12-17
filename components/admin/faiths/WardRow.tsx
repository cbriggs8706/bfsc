// components/admin/faiths/WardRow.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateWard, deleteWard } from '@/app/actions/faiths'
import type { Ward } from '@/types/faiths'

export function WardRow({
	ward,
	onDelete,
}: {
	ward: Ward
	onDelete: () => void
}) {
	const [name, setName] = useState(ward.name)

	return (
		<div className="flex gap-2 items-center">
			<Input
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={() => {
					if (name !== ward.name) {
						updateWard(ward.id, { name })
					}
				}}
				className="max-w-xs"
			/>

			<Button
				size="sm"
				variant="destructive"
				onClick={async () => {
					onDelete()
					await deleteWard(ward.id)
				}}
			>
				Delete
			</Button>
		</div>
	)
}
