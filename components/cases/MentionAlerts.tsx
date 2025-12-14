//components/cases/MentionAlerts.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function MentionAlerts() {
	const { data: session } = useSession()
	const params = useParams()
	const locale = params?.locale as string

	useEffect(() => {
		const userId = session?.user?.id
		if (!userId) return

		const channel = supabase
			.channel(`user-mentions:${userId}`)
			.on('broadcast', { event: 'mentioned' }, ({ payload }) => {
				toast.info('You were mentioned', {
					description: (
						<div className="space-y-1">
							<p>
								<strong>{payload.author.name}</strong> mentioned you
							</p>
							<p className="text-sm text-muted-foreground line-clamp-2">
								{payload.body}
							</p>
							<Link
								href={`/${locale}/cases/${payload.caseId}#comment-${payload.commentId}`}
								className="text-sm text-primary underline"
							>
								View comment →
							</Link>
						</div>
					),
					duration: 8000,
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
