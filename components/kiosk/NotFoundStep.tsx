// components/kiosk/NotFoundStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	name: string
	onGuest: () => void
	onCreateProfile: () => void
}

export function NotFoundStep({ name, onGuest, onCreateProfile }: Props) {
	return (
		<div className="space-y-4">
			<p className="text-lg text-center">
				Welcome! Would you like to save your name for faster sign-in next time?
			</p>

			<Label>Name</Label>
			<KioskInput value={name} disabled={true} />

			<KioskButton variant="secondary" onClick={onGuest}>
				No, this is a one time visit
			</KioskButton>
			<KioskButton onClick={onCreateProfile}>
				Yes, create an account
			</KioskButton>
		</div>
	)
}
