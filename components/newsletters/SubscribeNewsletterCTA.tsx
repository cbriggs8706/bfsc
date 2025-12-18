'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NewsletterSubscribeDialog } from './SubscribeNewsletterModal'

export function SubscribeNewsletterCTA() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Button size="lg" onClick={() => setOpen(true)}>
				Subscribe to our Monthly Newsletter
			</Button>

			<NewsletterSubscribeDialog open={open} onOpenChange={setOpen} />
		</>
	)
}
