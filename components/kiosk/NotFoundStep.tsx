// components/kiosk/NotFoundStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	name: string
	onContinue: () => void
}

export function NotFoundStep({ name, onContinue }: Props) {
	return (
		<div className="space-y-4">
			<p className="text-lg text-center">
				We could not find that name. Continue to choose your visit purpose and we
				will save your name for faster check-in next time.
			</p>

			<Label>Name</Label>
			<KioskInput value={name} disabled={true} />

			<KioskButton onClick={onContinue}>
				Continue
			</KioskButton>
		</div>
	)
}
