// components/cases/MentionCount.tsx
// components/cases/useMentionCount.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export function MentionCount(userId?: string) {
	const [count, setCount] = useState(0)

	useEffect(() => {
		if (!userId) return

		// initial fetch
		fetch('/api/mentions/unread-count')
			.then((r) => r.json())
			.then((d) => setCount(d.count))
	}, [userId])

	useEffect(() => {
		if (!userId) return

		const channel = supabase
			.channel(`user-mentions:${userId}`)
			.on('broadcast', { event: 'mentioned' }, () => {
				setCount((c) => c + 1)
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [userId])

	return { count, setCount }
}
