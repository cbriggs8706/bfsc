'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ShieldAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
	const router = useRouter()
	const { data: session, update } = useSession()
	const [isPending, setIsPending] = useState(false)

	if (!session?.user?.isImpersonating || !session.user.impersonatedBy) {
		return null
	}

	const actingAs = session.user.name ?? session.user.email ?? 'this user'
	const originalAdmin = session.user.impersonatedBy.name

	async function handleStopImpersonation() {
		try {
			setIsPending(true)
			const updatedSession = await update({ impersonationAction: 'stop' })
			if (updatedSession?.user?.isImpersonating) {
				throw new Error('Impersonation is still active')
			}
			toast.success('Returned to your admin account.')
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error('Unable to stop impersonation.')
		} finally {
			setIsPending(false)
		}
	}

	return (
		<div className="px-4">
			<Alert className="border-border/80 bg-card/95">
				<ShieldAlert className="mt-0.5" />
				<AlertTitle>Viewing as {actingAs}</AlertTitle>
				<AlertDescription className="w-full gap-3 md:flex md:items-center md:justify-between">
					<p>
						Signed in as {originalAdmin}. Any actions you take will use this
						user&apos;s access until you stop.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleStopImpersonation}
						disabled={isPending}
					>
						{isPending ? 'Returning…' : 'Stop Viewing As User'}
					</Button>
				</AlertDescription>
			</Alert>
		</div>
	)
}
