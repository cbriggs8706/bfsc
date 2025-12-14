// components/kiosk/ActionChoiceStep.tsx
'use client'

import { PersonSummary } from '@/types/kiosk'
import { KioskButton } from './KioskButton'

type Props = {
	person: PersonSummary
	onResearch: () => void
	onCheckout: () => void
	onFinish: () => void
}

export function ActionChoiceStep({
	person,
	onResearch,
	onCheckout,
	onFinish,
}: Props) {
	return (
		<div className="space-y-6 text-center">
			<p className="text-xl font-semibold">Welcome, {person.fullName}!</p>

			<p className="text-lg">What would you like to do today?</p>

			<div className="space-y-3">
				<KioskButton onClick={onResearch}>Start my research</KioskButton>

				<KioskButton variant="outline" onClick={onCheckout}>
					Check out / Return books or equipment
				</KioskButton>
			</div>

			<KioskButton variant="ghost" onClick={onFinish}>
				I’m done
			</KioskButton>
		</div>
	)
}
