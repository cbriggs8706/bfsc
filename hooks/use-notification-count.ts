// hooks/use-notification-count.ts
'use client'

import { useEffect, useState } from 'react'

export function useNotificationCount(userId?: string) {
	const [count, setCount] = useState(0)

	useEffect(() => {
		if (!userId) {
			console.log('❌ no userId')
			return
		}

		console.log('✅ fetching unread count for', userId)

		async function load() {
			const res = await fetch('/api/notifications/unread-count')
			const data = await res.json()
			console.log('📨 unread response', data)
			setCount(data.count ?? 0)
		}

		load()
	}, [userId])

	return { count }
}
