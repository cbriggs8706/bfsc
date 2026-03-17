'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ImpersonateUserButton({
	userId,
	userLabel,
	locale,
	disabled = false,
}: {
	userId: string
	userLabel: string
	locale: string
	disabled?: boolean
}) {
	const router = useRouter()
	const { update } = useSession()
	const [isPending, setIsPending] = useState(false)

	async function handleImpersonate() {
		try {
			setIsPending(true)
			const updatedSession = await update({
				impersonationAction: 'start',
				impersonationUserId: userId,
			})
			if (
				updatedSession?.user?.id !== userId ||
				!updatedSession.user.isImpersonating
			) {
				throw new Error('Impersonation was rejected')
			}
			toast.success(`Now viewing the app as ${userLabel}.`)
			router.push(`/${locale}/dashboard`)
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error('Unable to start impersonation.')
		} finally {
			setIsPending(false)
		}
	}

	return (
		<Button
			type="button"
			size="sm"
			variant="outline"
			onClick={handleImpersonate}
			disabled={disabled || isPending}
		>
			<Eye />
			{isPending ? 'Switching…' : 'View As'}
		</Button>
	)
}
