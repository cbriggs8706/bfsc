// components/kiosk/RoleChoiceStep.tsx
'use client'

import { PersonSummary } from '@/types/kiosk'
import { KioskButton } from './KioskButton'

type Props = {
	person: PersonSummary
	onVisit: () => void
	onTraining: () => void
	onGroup: () => void
	onShift?: () => void
	onEditName?: () => void
}

export function RoleChoiceStep({
	person,
	onVisit,
	onTraining,
	onGroup,
	onShift,
	onEditName,
}: Props) {
	return (
		<div className="space-y-4 text-center">
			<p className="text-xl font-semibold">Hi {person.fullName}!</p>

			<p className="text-lg">What brings you in today?</p>

			{onEditName && (
				<KioskButton variant="secondary" onClick={onEditName}>
					Edit name spelling
				</KioskButton>
			)}

			<KioskButton onClick={onVisit}>I’m visiting as a patron</KioskButton>

			<KioskButton variant="outline" onClick={onTraining}>
				I&apos;m here for training
			</KioskButton>

			<KioskButton variant="outline" onClick={onGroup}>
				I&apos;m here with a group
			</KioskButton>

			{onShift && (
				<KioskButton variant="outline" onClick={onShift}>
					I’m here for my shift
				</KioskButton>
			)}
		</div>
	)
}
