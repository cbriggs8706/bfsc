'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { SocialMediaConsentForm } from '@/components/forms/SocialMediaConsentForm'

export function SocialMediaConsentDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Fill Out Photo Consent Form</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Social Media Photo Consent</DialogTitle>
				</DialogHeader>
				<SocialMediaConsentForm />
			</DialogContent>
		</Dialog>
	)
}
