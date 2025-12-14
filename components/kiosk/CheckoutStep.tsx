'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PersonSummary } from '@/types/kiosk'
import { KioskButton } from './KioskButton'
import { KioskInput } from './KioskInput'

type LibraryLookupResult = {
	copyId: string
	copyCode: string
	status: 'available' | 'checked_out'
	item: {
		name: string
		type: 'book' | 'equipment'
		authorManufacturer?: string
	}
	checkedOutTo?: {
		name: string
	}
}

type Props = {
	person: PersonSummary
	onDone: () => void
}

export function CheckoutStep({ person, onDone }: Props) {
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<LibraryLookupResult | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const lookup = async () => {
		if (!code.trim()) return

		setLoading(true)
		setError(null)
		setResult(null)
		setSuccess(null)

		try {
			const res = await fetch(
				`/api/kiosk/library/lookup?code=${encodeURIComponent(code.trim())}`,
				{ cache: 'no-store' }
			)

			if (!res.ok) throw new Error()

			const data = await res.json()
			setResult(data)
		} catch {
			setError('We couldn’t find an item with that code.')
		} finally {
			setLoading(false)
		}
	}

	const handleAction = async () => {
		if (!result) return

		setLoading(true)
		setError(null)

		try {
			const endpoint =
				result.status === 'available'
					? '/api/kiosk/library/checkout'
					: '/api/kiosk/library/return'

			const body =
				result.status === 'available'
					? {
							copyId: result.copyId,
							borrowerUserId: person.userId ?? undefined,
							borrowerName: person.userId ? undefined : person.fullName,
					  }
					: { copyId: result.copyId }

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
				result.status === 'available'
					? 'Item checked out successfully'
					: 'Item returned successfully'
			)

			// Auto-reset for next scan (kiosk-friendly)
			setTimeout(() => {
				setCode('')
				setResult(null)
				setSuccess(null)
			}, 1200)
		} catch (err: any) {
			setError(err.message ?? 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') lookup()
	}

	return (
		<div className="space-y-5">
			<p className="text-xl text-center font-semibold">Check out / Return</p>

			<div>
				<Label className="text-lg">Scan or enter item code</Label>
				<KioskInput
					value={code}
					onChange={(e) => setCode(e.target.value)}
					onKeyDown={handleKeyDown}
					autoFocus
					placeholder="Scan barcode…"
				/>
			</div>

			<KioskButton disabled={!code || loading} onClick={lookup}>
				{loading ? 'Looking up…' : 'Find Item'}
			</KioskButton>

			{error && <p className="text-center text-destructive">{error}</p>}

			{success && (
				<p className="text-center text-green-600 font-semibold">{success}</p>
			)}

			{result && (
				<Card>
					<CardContent className="space-y-2 pt-4">
						<p className="text-lg font-semibold">{result.item.name}</p>

						<p className="text-muted-foreground">
							{result.item.type === 'book' ? 'Book' : 'Equipment'}
							{result.item.authorManufacturer &&
								` • ${result.item.authorManufacturer}`}
						</p>

						<p className="text-sm">
							Copy code: <strong>{result.copyCode}</strong>
						</p>

						<p className="text-sm">
							Status:{' '}
							<strong>
								{result.status === 'available' ? 'Available' : 'Checked out'}
							</strong>
						</p>

						{result.checkedOutTo && (
							<p className="text-sm text-muted-foreground">
								Checked out to {result.checkedOutTo.name}
							</p>
						)}
					</CardContent>
				</Card>
			)}

			{result && (
				<KioskButton onClick={handleAction} disabled={loading}>
					{result.status === 'available' ? 'Check Out' : 'Return'}
				</KioskButton>
			)}

			<KioskButton variant="ghost" onClick={onDone}>
				Done
			</KioskButton>
		</div>
	)
}
