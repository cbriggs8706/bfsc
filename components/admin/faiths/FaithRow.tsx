// components/admin/faiths/FaithRow.tsx
'use client'

import { useState } from 'react'
import { StakeRow } from './StakeRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateFaith, deleteFaith, createStake } from '@/app/actions/faiths'
import type { Faith, Stake } from '@/types/faiths'

export function FaithRow({ faith }: { faith: Faith }) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(faith.name)

	// 🔑 optimistic local state
	const [stakes, setStakes] = useState<Stake[]>(faith.stakes)
	const [newStake, setNewStake] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	return (
		<div className="border rounded p-3 space-y-2">
			{/* Faith header */}
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setOpen((prev) => !prev)}
				>
					{open ? '−' : '+'}
				</Button>

				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					onBlur={() => {
						if (name !== faith.name) {
							updateFaith(faith.id, { name })
						}
					}}
					className="max-w-xs"
				/>

				<Button
					size="sm"
					variant="destructive"
					onClick={() => deleteFaith(faith.id)}
				>
					Delete
				</Button>
			</div>

			{/* Stakes */}
			{open && (
				<div className="ml-6 space-y-2">
					{/* Add stake */}
					<div className="flex gap-2">
						<Input
							placeholder="New stake name"
							value={newStake}
							onChange={(e) => setNewStake(e.target.value)}
						/>
						<Button
							size="sm"
							disabled={isSaving}
							onClick={async () => {
								if (!newStake.trim() || isSaving) return

								setIsSaving(true)

								const optimisticStake: Stake = {
									id: crypto.randomUUID(),
									name: newStake,
									wards: [],
								}

								setStakes((prev) => [...prev, optimisticStake])
								setNewStake('')

								try {
									await createStake({
										faithId: faith.id,
										name: optimisticStake.name,
									})
								} catch (err) {
									// rollback if server fails
									setStakes((prev) =>
										prev.filter((s) => s.id !== optimisticStake.id)
									)
									console.error(err)
								} finally {
									setIsSaving(false)
								}
							}}
						>
							{isSaving ? 'Saving…' : 'Add'}
						</Button>
					</div>

					{/* Existing stakes */}
					{stakes.map((stake) => (
						<StakeRow
							key={stake.id}
							stake={stake}
							onDelete={() =>
								setStakes((prev) => prev.filter((s) => s.id !== stake.id))
							}
						/>
					))}
				</div>
			)}
		</div>
	)
}
