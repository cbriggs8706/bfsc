// components/custom/ConsultantMultiSelect.tsx
'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { PresenterOption } from '@/db/queries/classes'

type Props = {
	options: PresenterOption[]
	value: string[]
	onChange: (ids: string[]) => void
	placeholder?: string
}

export function PresenterMultiSelect({
	options,
	value,
	onChange,
	placeholder = 'Search presenters…',
}: Props) {
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)

	const filtered = useMemo(() => {
		if (!query.trim()) return options.slice(0, 10)

		const q = query.toLowerCase()
		return options
			.filter(
				(p) =>
					p.name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
			)
			.slice(0, 10)
	}, [options, query])

	const toggle = (id: string) => {
		onChange(
			value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
		)
	}

	const selected = useMemo(
		() => options.filter((o) => value.includes(o.id)),
		[options, value]
	)

	return (
		<div className="space-y-2 relative">
			{/* Selected presenters */}
			{selected.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selected.map((p) => (
						<Badge key={p.id} variant="secondary" className="flex gap-1">
							<span>{p.name ?? p.email}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-4 w-4"
								onClick={() => toggle(p.id)}
							>
								<X className="h-3 w-3" />
							</Button>
						</Badge>
					))}
				</div>
			)}

			{/* Search input */}
			<Input
				value={query}
				placeholder={placeholder}
				onChange={(e) => {
					setQuery(e.target.value)
					setOpen(true)
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => setTimeout(() => setOpen(false), 150)}
			/>

			{/* Dropdown */}
			{open && filtered.length > 0 && (
				<div className="absolute z-50 w-full rounded-md border bg-background shadow-md">
					{filtered.map((p) => {
						const checked = value.includes(p.id)
						return (
							<button
								type="button"
								key={p.id}
								onClick={() => toggle(p.id)}
								className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
							>
								<input
									type="checkbox"
									checked={checked}
									readOnly
									className="mt-1"
								/>
								<div>
									<div className="font-medium">{p.name ?? p.email}</div>
									<div className="text-xs text-muted-foreground">{p.email}</div>
								</div>
							</button>
						)
					})}
				</div>
			)}
		</div>
	)
}
