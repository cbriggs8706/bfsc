'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PersonSummary } from '@/types/kiosk'
import { KioskButton } from './KioskButton'
import { KioskInput } from './KioskInput'

type LibrarySearchResult = {
	copyId: string
	copyCode: string
	status: 'available' | 'checked_out'
	item: {
		name: string
		type: 'book' | 'equipment'
		authorManufacturer?: string
	}
}

type LibraryLookupResult = LibrarySearchResult & {
	checkedOutTo?: {
		name: string
	}
}

type Props = {
	person: PersonSummary
	onDone: () => void
}

export function CheckoutStep({ person, onDone }: Props) {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<LibrarySearchResult[]>([])
	const [selected, setSelected] = useState<LibraryLookupResult | null>(null)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// ──────────────────────────────
	// SEARCH (ANY FIELD)
	// ──────────────────────────────
	useEffect(() => {
		if (query.trim().length < 2) {
			setResults([])
			return
		}

		const t = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/kiosk/library/search?q=${encodeURIComponent(query)}`,
					{ cache: 'no-store' }
				)

				if (!res.ok) throw new Error()

				const data = await res.json()
				setResults(data.results)
			} catch {
				setResults([])
			}
		}, 250)

		return () => clearTimeout(t)
	}, [query])

	// ──────────────────────────────
	// LOOKUP SELECTED COPY
	// ──────────────────────────────
	// useEffect(() => {
	// 	if (!selected) return
	// 	;(async () => {
	// 		setLoading(true)
	// 		setError(null)

	// 		try {
	// 			const res = await fetch(
	// 				`/api/kiosk/library/lookup?copyId=${selected.copyId}`,
	// 				{ cache: 'no-store' }
	// 			)

	// 			if (!res.ok) throw new Error()

	// 			const data = await res.json()
	// 			setSelected(data)
	// 		} catch {
	// 			setError('Unable to load item details.')
	// 		} finally {
	// 			setLoading(false)
	// 		}
	// 	})()
	// }, [selected?.copyId])

	// ──────────────────────────────
	// CHECKOUT / RETURN
	// ──────────────────────────────
	const handleAction = async () => {
		if (!selected) return

		setLoading(true)
		setError(null)

		try {
			const endpoint =
				selected.status === 'available'
					? '/api/kiosk/library/checkout'
					: '/api/kiosk/library/return'

			const body =
				selected.status === 'available'
					? {
							copyId: selected.copyId,
							borrowerUserId: person.userId ?? undefined,
							borrowerName: person.userId ? undefined : person.fullName,
					  }
					: { copyId: selected.copyId }

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			if (!res.ok) {
				const msg = await res.json()
				throw new Error(msg.error ?? 'Action failed')
			}

			setSuccess(
				selected.status === 'available'
					? 'Item checked out successfully'
					: 'Item returned successfully'
			)

			// Auto-reset for next scan (kiosk-friendly)
			setTimeout(() => {
				setQuery('')
				setResults([])
				setSelected(null)
				setSuccess(null)
			}, 1200)
		} catch (err: any) {
			setError(err.message ?? 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	// ──────────────────────────────
	// RENDER
	// ──────────────────────────────
	return (
		<div className="space-y-5">
			<p className="text-xl text-center font-semibold">
				Check out / Return an Item
			</p>

			<div>
				<Label className="text-lg">
					Search by title, author, ISBN, or scan barcode
				</Label>
				<KioskInput
					value={query}
					onChange={(e) => {
						setQuery(e.target.value)
						setSelected(null)
						setSuccess(null)
					}}
					autoFocus
					placeholder="Start typing or scan…"
				/>
			</div>

			{/* SEARCH RESULTS */}
			{results.length > 0 && !selected && (
				<div className="space-y-2 max-h-64 overflow-y-auto">
					{results.map((r) => (
						<KioskButton
							key={r.copyId}
							variant="secondary"
							className="justify-start text-left"
							onClick={() => setSelected(r as LibraryLookupResult)}
						>
							<div>
								<p className="font-semibold">{r.item.name}</p>
								<p className="text-sm text-muted-foreground">
									{r.item.authorManufacturer ?? '—'} • {r.copyCode}
								</p>
							</div>
						</KioskButton>
					))}
				</div>
			)}

			{/* SELECTED ITEM */}
			{selected && (
				<Card>
					<CardContent className="space-y-2 pt-4">
						<p className="text-lg font-semibold">{selected.item.name}</p>

						<p className="text-muted-foreground">
							{selected.item.type === 'book' ? 'Book' : 'Equipment'}
							{selected.item.authorManufacturer &&
								` • ${selected.item.authorManufacturer}`}
						</p>

						<p className="text-sm">
							Copy code: <strong>{selected.copyCode}</strong>
						</p>

						<p className="text-sm">
							Status:{' '}
							<strong>
								{selected.status === 'available' ? 'Available' : 'Checked out'}
							</strong>
						</p>

						{selected.checkedOutTo && (
							<p className="text-sm text-muted-foreground">
								Checked out to {selected.checkedOutTo.name}
							</p>
						)}
					</CardContent>
				</Card>
			)}

			{/* ACTION */}
			{selected && (
				<KioskButton onClick={handleAction} disabled={loading}>
					{selected.status === 'available' ? 'Check Out' : 'Return'}
				</KioskButton>
			)}

			{error && <p className="text-center text-destructive">{error}</p>}
			{success && (
				<p className="text-center text-green-600 font-semibold">{success}</p>
			)}

			<KioskButton variant="default" onClick={onDone}>
				Done
			</KioskButton>
		</div>
	)
}
