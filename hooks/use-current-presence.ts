// hooks/use-current-presence.ts
'use client'

import { CurrentPresence } from '@/types/kiosk'
import { useEffect, useState } from 'react'

export function useCurrentPresence(pollMs = 0) {
	const [data, setData] = useState<CurrentPresence | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let alive = true

		const load = async () => {
			const res = await fetch('/api/shifts/current', {
				cache: 'no-store',
			})

			if (!res.ok || !alive) return

			const json = await res.json()
			if (!alive) return

			setData(json)
			setLoading(false)
		}

		load()

		if (!pollMs)
			return () => {
				alive = false
			}

		const id = setInterval(load, pollMs)

		return () => {
			alive = false
			clearInterval(id)
		}
	}, [pollMs])

	return { data, loading }
}
