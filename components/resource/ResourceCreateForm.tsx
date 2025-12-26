// components/resources/ResourceCreateForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createResource } from '@/app/actions/resources/create-resource'
import { Resource, ResourceType } from '@/types/resource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const DEFAULT_DURATION = 120
const DEFAULT_MAX_CONCURRENT = 1

type Props = {
	locale: string
	onCreated: (resource: Resource) => void
}

export function ResourceCreateForm({ locale, onCreated }: Props) {
	const [pending, startTransition] = useTransition()

	// Core fields
	const [name, setName] = useState('')
	const [type, setType] = useState<ResourceType>('equipment')
	const [defaultDurationMinutes, setDefaultDurationMinutes] =
		useState(DEFAULT_DURATION)
	const [maxConcurrent, setMaxConcurrent] = useState(DEFAULT_MAX_CONCURRENT)
	const [capacity, setCapacity] = useState<number | null>(null)
	const [isActive, setIsActive] = useState(true)

	// Optional details
	const [description, setDescription] = useState('')
	const [requiredItems, setRequiredItems] = useState('')
	const [prep, setPrep] = useState('')
	const [notes, setNotes] = useState('')
	const [link, setLink] = useState('')

	function reset() {
		setName('')
		setType('equipment')
		setDefaultDurationMinutes(DEFAULT_DURATION)
		setMaxConcurrent(DEFAULT_MAX_CONCURRENT)
		setCapacity(null)
		setIsActive(true)
		setDescription('')
		setRequiredItems('')
		setPrep('')
		setNotes('')
		setLink('')
	}

	function handleSubmit() {
		if (!name.trim()) return

		startTransition(async () => {
			const resource = await createResource({
				name: name.trim(),
				type,
				defaultDurationMinutes,
				maxConcurrent: type === 'activity' ? 1 : maxConcurrent,
				capacity: type === 'activity' ? capacity : null,
				isActive,
				description: description || null,
				requiredItems: requiredItems || null,
				prep: prep || null,
				notes: notes || null,
				link: link || null,
			})

			reset()
			onCreated(resource)
		})
	}

	return (
		<Card>
			<CardHeader>
				<h2 className="text-lg font-medium">Add new resource or activity</h2>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Name */}
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Resource / Activity name"
				/>

				{/* Core settings */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{/* Type */}
					<div>
						<label className="text-sm font-medium">Type</label>
						<Select
							value={type}
							onValueChange={(v) => setType(v as ResourceType)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="equipment">Equipment</SelectItem>
								<SelectItem value="room">Room</SelectItem>
								<SelectItem value="booth">Recording Booth</SelectItem>
								<SelectItem value="activity">Activity</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Duration */}
					<div>
						<label className="text-sm font-medium">
							Default duration (min)
						</label>
						<Input
							type="number"
							min={15}
							step={15}
							value={defaultDurationMinutes}
							onChange={(e) =>
								setDefaultDurationMinutes(Number(e.target.value))
							}
						/>
					</div>

					{/* Capacity / Max Concurrent */}
					{type === 'activity' ? (
						<div>
							<label className="text-sm font-medium">Capacity</label>
							<Input
								type="number"
								min={1}
								value={capacity ?? ''}
								onChange={(e) => setCapacity(Number(e.target.value))}
							/>
						</div>
					) : (
						<div>
							<label className="text-sm font-medium">Max concurrent</label>
							<Input
								type="number"
								min={1}
								value={maxConcurrent}
								onChange={(e) => setMaxConcurrent(Number(e.target.value))}
							/>
						</div>
					)}

					{/* Active */}
					<div className="flex items-center gap-2 pt-6">
						<Switch checked={isActive} onCheckedChange={setIsActive} />
						<span className="text-sm">Active</span>
					</div>
				</div>

				{/* Optional details */}
				<div className="space-y-4">
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Description (shown to patrons)"
					/>

					<Textarea
						value={requiredItems}
						onChange={(e) => setRequiredItems(e.target.value)}
						placeholder="Required items (e.g. flash drive, photos)"
					/>

					<Textarea
						value={prep}
						onChange={(e) => setPrep(e.target.value)}
						placeholder="Preparation instructions"
					/>

					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Internal notes (staff only)"
					/>

					<Input
						value={link}
						onChange={(e) => setLink(e.target.value)}
						placeholder="Optional link (training, policy, form)"
					/>
				</div>

				<Button onClick={handleSubmit} disabled={pending}>
					{pending ? 'Creating…' : 'Create resource'}
				</Button>
			</CardContent>
		</Card>
	)
}
