'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { NewsletterSubscribeDialog } from './SubscribeNewsletterModal'

export function SubscribeNewsletterCTA() {
	const [open, setOpen] = useState(false)
	const t = useTranslations('home.subscribe')

	return (
		<>
			<Button size="lg" onClick={() => setOpen(true)}>
				{t('cta')}
			</Button>

			<NewsletterSubscribeDialog open={open} onOpenChange={setOpen} />
		</>
	)
}
