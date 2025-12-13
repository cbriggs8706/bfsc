// components/cases/MentionBell.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

export function MentionBell({ userId }: { userId: string }) {
	const [count, setCount] = useState(0)

	useEffect(() => {
		fetch('/api/mentions/unread-count')
			.then((r) => r.json())
			.then((d) => setCount(d.count))
	}, [])

	useEffect(() => {
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

	if (count === 0) return null

	return (
		<Link href="/cases/mentions" className="relative">
			<span className="text-lg">🔔</span>
			<span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
				{count}
			</span>
		</Link>
	)
}
