// components/newsletters/SubscribeNewsletterModal.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
	const t = useTranslations('home.subscribe')

	async function handleSubmit() {
		if (!email.trim().includes('@')) {
			setStatus('error')
			setError(t('invalidEmail'))
			return
		}

		setStatus('loading')
		setError(null)

		const result = await subscribeToNewsletter(email)

		if (result.status === 'ok') {
			setStatus('success')
		} else if (result.status === 'already-confirmed') {
			setStatus('already')
		} else {
			setStatus('error')
			setError(result.message || t('genericError'))
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
					<DialogTitle>{t('title')}</DialogTitle>
				</DialogHeader>

				{status === 'success' && (
					<div className="flex items-start gap-3 text-sm">
						<CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
						<p>{t('success')}</p>
					</div>
				)}

				{status === 'already' && (
					<div className="flex items-start gap-3 text-sm">
						<CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
						<p>{t('alreadySubscribed')}</p>
					</div>
				)}

				{status === 'idle' || status === 'loading' || status === 'error' ? (
					<div className="space-y-4">
						<Input
							type="email"
							placeholder={t('emailPlaceholder')}
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
									{t('submitting')}
								</>
							) : (
								t('submit')
							)}
						</Button>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
