'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useDebouncedEffect } from '@/hooks/use-debounced-value'

type MonthOption = {
	value: string
	label: string
}

type Props = {
	q: string
	year: string
	month: string
	years: number[]
	months: MonthOption[]
	locale: string
}

export function NewsletterFilters({
	q,
	year,
	month,
	years,
	months,
	locale,
}: Props) {
	const router = useRouter()
	const pathname = usePathname()

	const [search, setSearch] = useState(q)
	const [selectedYear, setSelectedYear] = useState(year)
	const [selectedMonth, setSelectedMonth] = useState(month)
	const lastPushed = useRef('')

	function pushFilters(next: { q: string; year: string; month: string }) {
		const params = new URLSearchParams()
		const trimmedQ = next.q.trim()
		if (trimmedQ) params.set('q', trimmedQ)
		if (next.year) params.set('year', next.year)
		if (next.month) params.set('month', next.month)
		const qs = params.toString()
		if (qs === lastPushed.current) return
		lastPushed.current = qs
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
	}

	useDebouncedEffect(() => {
		pushFilters({ q: search, year: selectedYear, month: selectedMonth })
	}, [search], 250)

	return (
		<div className="grid grid-cols-2 gap-2 max-w-4xl lg:grid-cols-4">
			<input
				type="text"
				name="q"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search newsletters"
				className="border rounded px-3 py-2 bg-card col-span-2"
			/>
			<select
				name="year"
				value={selectedYear}
				onChange={(e) => {
					const nextYear = e.target.value
					setSelectedYear(nextYear)
					pushFilters({ q: search, year: nextYear, month: selectedMonth })
				}}
				className="border rounded px-3 py-2 bg-card"
			>
				<option value="">All years</option>
				{years.map((y) => (
					<option key={y} value={String(y)}>
						{y}
					</option>
				))}
			</select>
			<select
				name="month"
				value={selectedMonth}
				onChange={(e) => {
					const nextMonth = e.target.value
					setSelectedMonth(nextMonth)
					pushFilters({ q: search, year: selectedYear, month: nextMonth })
				}}
				className="border rounded px-3 py-2 bg-card"
			>
				<option value="">All months</option>
				{months.map((m) => (
					<option key={m.value} value={m.value}>
						{m.label}
					</option>
				))}
			</select>
			{(search || selectedYear || selectedMonth) && (
				<Button asChild variant="outline" className="border rounded px-4 py-2">
					<Link href={`/${locale}/newsletters`}>Clear</Link>
				</Button>
			)}
		</div>
	)
}
