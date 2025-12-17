// components/admin/faiths/FaithAdminManager.tsx
'use client'

import { useState } from 'react'
import { FaithRow } from './FaithRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFaith } from '@/app/actions/faiths'
import type { Faith } from '@/types/faiths'

export function FaithAdminManager({
	initialFaiths,
}: {
	initialFaiths: Faith[]
}) {
	const [faiths] = useState<Faith[]>(initialFaiths)
	const [newFaith, setNewFaith] = useState('')

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Input
					placeholder="New faith name"
					value={newFaith}
					onChange={(e) => setNewFaith(e.target.value)}
				/>
				<Button
					onClick={async () => {
						await createFaith({ name: newFaith })
						setNewFaith('')
					}}
				>
					Add
				</Button>
			</div>

			<div className="space-y-2">
				{faiths.map((faith) => (
					<FaithRow key={faith.id} faith={faith} />
				))}
			</div>
		</div>
	)
}
