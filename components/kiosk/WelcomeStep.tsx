'use client'

import { KioskButton } from './KioskButton'

type Props = {
	secondsRemaining: number
	onReturnNow: () => void
}

export function WelcomeStep({ secondsRemaining, onReturnNow }: Props) {
	return (
		<div className="space-y-4 text-center py-10">
			<p className="text-4xl font-semibold">Welcome!</p>
			<p className="text-2xl text-muted-foreground">We&apos;re glad you&apos;re here.</p>
			<p className="text-base text-muted-foreground">
				Returning to sign-in in {secondsRemaining} seconds...
			</p>
			<KioskButton variant="outline" onClick={onReturnNow}>
				Return to Sign In Now
			</KioskButton>
		</div>
	)
}
