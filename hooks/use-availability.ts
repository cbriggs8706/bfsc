// hooks/use-availability.ts
'use client'

import { AvailabilityResponse } from '@/types/resource'
import { useEffect, useState } from 'react'

export function useAvailability(
	resourceId: string | null,
	date: string | null
) {
	const [data, setData] = useState<AvailabilityResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!resourceId || !date) return
		console.log('[availability] fetching', { resourceId, date })
		let cancelled = false

		fetch(`/api/resources/availability?resourceId=${resourceId}&date=${date}`)
			.then((res) => {
				if (!res.ok) {
					throw new Error('Failed to load availability')
				}
				return res.json()
			})
			.then((json: AvailabilityResponse) => {
				if (!cancelled) {
					setData(json)
					setError(null)
				}
			})
			.catch((err: Error) => {
				if (!cancelled) {
					setError(err.message)
					setData(null)
				}
			})

		return () => {
			cancelled = true
		}
	}, [resourceId, date])

	// ✅ DERIVED STATE (no lint warning)
	const loading = Boolean(resourceId && date) && data === null && error === null

	return {
		data,
		error,
		loading,
	}
}
