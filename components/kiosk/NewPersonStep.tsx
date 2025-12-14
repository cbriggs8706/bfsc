// components/kiosk/NewPersonStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	newName: string
	newEmail: string
	wantsPasscode: boolean
	setNewName: (v: string) => void
	setNewEmail: (v: string) => void
	setWantsPasscode: (v: boolean) => void
	onSubmit: () => void
}

export function NewPersonStep({
	newName,
	newEmail,
	wantsPasscode,
	setNewName,
	setNewEmail,
	setWantsPasscode,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<p className="text-lg">
				Welcome! Let’s save your name for faster sign-in next time.
			</p>

			<div>
				<Label>Name</Label>
				<KioskInput
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
				/>
			</div>

			<div>
				<Label>Email (optional)</Label>
				<KioskInput
					type="email"
					value={newEmail}
					onChange={(e) => setNewEmail(e.target.value)}
				/>
			</div>

			<label className="flex items-center gap-3 text-lg">
				<input
					type="checkbox"
					checked={wantsPasscode}
					onChange={(e) => setWantsPasscode(e.target.checked)}
				/>
				Give me a 6-digit code for faster login
			</label>

			<KioskButton onClick={onSubmit}>Save & Continue</KioskButton>
		</div>
	)
}
