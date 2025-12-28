// components/library/LibraryFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useDebouncedEffect } from '@/hooks/use-debounced-value'

interface Props {
	tags: string[]
}

export function LibraryFilters({ tags }: Props) {
	const router = useRouter()
	const params = useSearchParams()

	const urlQ = params.get('q') ?? ''
	const [value, setValue] = useState(urlQ)

	// 🔁 KEEP INPUT IN SYNC WITH URL
	useEffect(() => {
		setValue(urlQ)
	}, [urlQ])

	// ⏱️ DEBOUNCED URL UPDATE
	useEffect(() => {
		if (value === urlQ) return

		const timeout = setTimeout(() => {
			const next = new URLSearchParams(params.toString())

			if (value) next.set('q', value)
			else next.delete('q')

			next.delete('page')
			router.push(`?${next.toString()}`)
		}, 300)

		return () => clearTimeout(timeout)
	}, [value, urlQ, params, router])

	useDebouncedEffect(
		() => {
			if (value === urlQ) return

			const next = new URLSearchParams(params.toString())
			if (value) next.set('q', value)
			else next.delete('q')

			next.delete('page')
			router.push(`?${next.toString()}`)
		},
		[value, urlQ, params, router],
		400
	)

	function update(key: string, value?: string) {
		const next = new URLSearchParams(params)
		if (!value) next.delete(key)
		else next.set(key, value)
		next.delete('page')
		router.push(`?${next.toString()}`)
	}

	return (
		<div className="flex flex-col md:flex-row gap-3">
			<Input
				placeholder="Search name"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>

			{/* Tags */}
			<Select
				value={params.get('tag') ?? 'all'}
				onValueChange={(v) => update('tag', v === 'all' ? undefined : v)}
			>
				<SelectTrigger className="md:w-48">
					<SelectValue placeholder="All tags" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All tags</SelectItem>
					{tags.map((tag) => (
						<SelectItem key={tag} value={tag}>
							{tag}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={params.get('type') ?? 'all'}
				onValueChange={(v) => update('type', v === 'all' ? undefined : v)}
			>
				<SelectTrigger className="md:w-48">
					<SelectValue placeholder="All types" />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="all">All Types</SelectItem>
					<SelectItem value="book">Books</SelectItem>
					<SelectItem value="equipment">Equipment</SelectItem>
				</SelectContent>
			</Select>

			<Button
				variant="outline"
				onClick={() => {
					setValue('')
					router.push('?')
				}}
			>
				Clear
			</Button>
		</div>
	)
}
