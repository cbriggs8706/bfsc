'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { LibraryItemType } from '@/types/kiosk'

export type LibraryItemFormInput = {
	type: 'book' | 'equipment'
	name: string
	description: string
	year?: number
	authorManufacturer?: string
	isbn?: string
	notes?: string
	copyCodes: string[]
	tags: string[]
}

type Props = {
	mode: 'create' | 'update'
	locale: string
	initial?: Partial<LibraryItemFormInput>
	onSubmit: (input: LibraryItemFormInput) => Promise<void>
	onDoneHref: string
}

export function LibraryItemForm({
	mode,
	initial,
	onSubmit,
	onDoneHref,
}: Props) {
	const [type, setType] = useState<LibraryItemType>(initial?.type ?? 'book')
	const [name, setName] = useState(initial?.name ?? '')
	const [description, setDescription] = useState(initial?.description ?? '')
	const [year, setYear] = useState(initial?.year ? String(initial.year) : '')
	const [authorManufacturer, setAuthorManufacturer] = useState(
		initial?.authorManufacturer ?? ''
	)
	const [isbn, setIsbn] = useState(initial?.isbn ?? '')
	const [notes, setNotes] = useState(initial?.notes ?? '')
	const [copyCodesText, setCopyCodesText] = useState(
		initial?.copyCodes?.join('\n') ?? ''
	)
	const [tagsText, setTagsText] = useState(initial?.tags?.join('\n') ?? '')

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit() {
		setLoading(true)
		setError(null)

		const copyCodes = copyCodesText
			.split('\n')
			.map((c) => c.trim())
			.filter(Boolean)

		const tags = tagsText
			.split('\n')
			.map((c) => c.trim())
			.filter(Boolean)

		try {
			await onSubmit({
				type,
				name,
				description,
				year: year ? Number(year) : undefined,
				authorManufacturer: authorManufacturer || undefined,
				isbn: isbn || undefined,
				notes: notes || undefined,
				copyCodes,
				tags,
			})

			window.location.href = onDoneHref
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError('Save failed')
			}
		}
	}

	return (
		<div className="space-y-4">
			<div>
				<Label>Type</Label>
				<Select value={type} onValueChange={(v: LibraryItemType) => setType(v)}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="book">Book</SelectItem>
						<SelectItem value="equipment">Equipment</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label>Name</Label>
				<Input value={name} onChange={(e) => setName(e.target.value)} />
			</div>

			<div>
				<Label>Description</Label>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
			</div>

			<div>
				<Label>Year</Label>
				<Input
					type="number"
					value={year}
					onChange={(e) => setYear(e.target.value)}
				/>
			</div>

			<div>
				<Label>Author / Manufacturer</Label>
				<Input
					value={authorManufacturer}
					onChange={(e) => setAuthorManufacturer(e.target.value)}
				/>
			</div>

			{type === 'book' && (
				<div>
					<Label>ISBN</Label>
					<Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
				</div>
			)}

			<div>
				<Label>Notes</Label>
				<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
			</div>

			<div>
				<Label>Copy Codes (one per line)</Label>
				<Textarea
					placeholder="BK-001&#10;BK-002"
					value={copyCodesText}
					onChange={(e) => setCopyCodesText(e.target.value)}
				/>
			</div>
			<div>
				<Label>Tags (one per line)</Label>
				<Textarea
					placeholder="Burley, History, Scanner"
					value={tagsText}
					onChange={(e) => setTagsText(e.target.value)}
				/>
			</div>

			{error && <p className="text-destructive">{error}</p>}

			<Button
				className="w-full"
				onClick={handleSubmit}
				disabled={loading || !name || !description}
			>
				{mode === 'create'
					? loading
						? 'Creating…'
						: 'Create Item'
					: loading
					? 'Saving…'
					: 'Save Changes'}
			</Button>
		</div>
	)
}
