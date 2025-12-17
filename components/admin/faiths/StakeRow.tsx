// components/admin/faiths/StakeRow.tsx
'use client'

import { useState } from 'react'
import { WardRow } from './WardRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateStake, deleteStake, createWard } from '@/app/actions/faiths'
import type { Stake, Ward } from '@/types/faiths'

export function StakeRow({
	stake,
	onDelete,
}: {
	stake: Stake
	onDelete: () => void
}) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(stake.name)

	// 🔑 optimistic local state
	const [wards, setWards] = useState<Ward[]>(stake.wards)
	const [newWard, setNewWard] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	return (
		<div className="border rounded p-2 space-y-2">
			{/* Stake header */}
			<div className="flex gap-2 items-center">
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
						if (name !== stake.name) {
							updateStake(stake.id, { name })
						}
					}}
					className="max-w-xs"
				/>

				<Button
					size="sm"
					variant="destructive"
					onClick={async () => {
						onDelete()
						await deleteStake(stake.id)
					}}
				>
					Delete
				</Button>
			</div>

			{/* Wards */}
			{open && (
				<div className="ml-6 space-y-2">
					{/* Add ward */}
					<div className="flex gap-2">
						<Input
							placeholder="New ward name"
							value={newWard}
							onChange={(e) => setNewWard(e.target.value)}
						/>
						<Button
							size="sm"
							disabled={isSaving}
							onClick={async () => {
								if (!newWard.trim() || isSaving) return

								setIsSaving(true)

								const optimisticWard: Ward = {
									id: crypto.randomUUID(),
									name: newWard,
								}

								setWards((prev) => [...prev, optimisticWard])
								setNewWard('')

								try {
									await createWard({
										stakeId: stake.id,
										name: optimisticWard.name,
									})
								} catch {
									setWards((prev) =>
										prev.filter((w) => w.id !== optimisticWard.id)
									)
								} finally {
									setIsSaving(false)
								}
							}}
						>
							{isSaving ? 'Saving…' : 'Add'}
						</Button>
					</div>

					{/* Existing wards */}
					{wards.map((ward) => (
						<WardRow
							key={ward.id}
							ward={ward}
							onDelete={() =>
								setWards((prev) => prev.filter((w) => w.id !== ward.id))
							}
						/>
					))}
				</div>
			)}
		</div>
	)
}
