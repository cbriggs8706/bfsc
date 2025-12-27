// components/worker/WorkerAlerts.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function WorkerAlerts() {
	const { data: session } = useSession()

	useEffect(() => {
		if (!session?.user?.id) return

		const channel = supabase
			.channel(`worker-${session.user.id}`)
			.on('broadcast', { event: 'new-patron' }, ({ payload }) => {
				toast.info('New patron signed in', {
					description: (
						<div className="space-y-1">
							<p>
								<strong>{payload.patronName}</strong>
							</p>
							<p className="text-sm text-muted-foreground">
								Reason: {payload.purposeName}
							</p>
						</div>
					),
					duration: Infinity,
					closeButton: true,
				})
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [session?.user?.id])

	return null
}
