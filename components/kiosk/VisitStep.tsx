// components/kiosk/VisitStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { PersonSummary, Purpose } from '@/types/kiosk'
import { KioskButton } from './KioskButton'
import { cn } from '@/lib/utils'

type Props = {
	person: PersonSummary
	purposes: Purpose[]
	selectedPurposeId: string
	setSelectedPurposeId: (v: string) => void
	onSubmit: () => void
}

export function VisitStep({
	person,
	purposes,
	selectedPurposeId,
	setSelectedPurposeId,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<div>
				<p className="text-xl font-semibold">Welcome, {person.fullName}!</p>

				<div className="space-y-3">
					<Label className="text-lg">What would you like to do today?</Label>

					<div className="grid gap-3">
						{purposes.map((p) => {
							const isSelected = selectedPurposeId === String(p.id)

							return (
								<KioskButton
									key={p.id}
									variant={isSelected ? 'default' : 'secondary'}
									className={cn(
										'h-14 text-lg justify-start',
										isSelected && 'ring-2 ring-primary'
									)}
									onClick={() => {
										setSelectedPurposeId(String(p.id))
										onSubmit()
									}}
								>
									{p.name}
								</KioskButton>
							)
						})}
					</div>
				</div>
			</div>

			{/* <label className="flex items-center gap-3 text-lg">
				<input
					type="checkbox"
					checked={mailingOptIn}
					onChange={(e) => setMailingOptIn(e.target.checked)}
				/>
				I’d like to receive emails about classes and events
			</label> */}

			{/* <KioskButton onClick={onSubmit}>Sign me in</KioskButton> */}
		</div>
	)
}
