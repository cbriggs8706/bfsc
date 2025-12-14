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

export function LibraryFilters() {
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
		const timeout = setTimeout(() => {
			const next = new URLSearchParams(params.toString())

			if (value) next.set('q', value)
			else next.delete('q')

			next.delete('page')
			router.push(`?${next.toString()}`)
		}, 300)

		return () => clearTimeout(timeout)
	}, [value, router])

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
				placeholder="Search name or tags"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>

			<Select
				value={params.get('type') ?? 'all'}
				onValueChange={(v) => update('type', v === 'all' ? undefined : v)}
			>
				<SelectTrigger className="md:w-48">
					<SelectValue placeholder="All types" />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="all">All</SelectItem>
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
