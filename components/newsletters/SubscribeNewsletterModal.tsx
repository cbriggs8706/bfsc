// components/newsletters/SubscribeNewsletterModal.tsx
'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { subscribeToNewsletter } from '@/app/actions/newsletter/subscribe'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'already' | 'error'

export function NewsletterSubscribeDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<Status>('idle')
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit() {
		setStatus('loading')
		setError(null)

		const result = await subscribeToNewsletter(email)

		if (result.status === 'ok') {
			setStatus('success')
		} else if (result.status === 'already-confirmed') {
			setStatus('already')
		} else {
			setStatus('error')
			setError(result.message)
		}
	}

	function reset() {
		setEmail('')
		setStatus('idle')
		setError(null)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				onOpenChange(o)
				if (!o) reset()
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Subscribe to our Monthly Newsletter</DialogTitle>
				</DialogHeader>

				{/* SUCCESS */}
				{status === 'success' && (
					<div className="flex items-start gap-3 text-sm">
						<CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
						<p>Check your email to confirm your subscription.</p>
					</div>
				)}

				{/* ALREADY CONFIRMED */}
				{status === 'already' && (
					<div className="flex items-start gap-3 text-sm">
						<CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
						<p>This email is already subscribed to the newsletter.</p>
					</div>
				)}

				{/* FORM */}
				{status === 'idle' || status === 'loading' || status === 'error' ? (
					<div className="space-y-4">
						<Input
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={status === 'loading'}
						/>

						{error && (
							<div className="flex items-center gap-2 text-sm text-destructive">
								<AlertCircle className="h-4 w-4" />
								{error}
							</div>
						)}

						<Button
							onClick={handleSubmit}
							className="w-full"
							disabled={status === 'loading'}
						>
							{status === 'loading' ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Subscribing…
								</>
							) : (
								'Subscribe'
							)}
						</Button>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
