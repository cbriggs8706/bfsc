// components/kiosk/ConsultantsStep.tsx
'use client'

import { ConsultantCard } from '@/components/kiosk/ConsultantCard'
import { OnShiftConsultant } from '@/types/kiosk'
import { KioskButton } from './KioskButton'

type Props = {
	consultants: OnShiftConsultant[]
	onDone: () => void
}

export function ConsultantsStep({ consultants, onDone }: Props) {
	return (
		<div className="space-y-4">
			<p className="text-xl text-center font-semibold">You’re signed in!</p>

			{consultants.length > 0 ? (
				<>
					<p className="text-center text-muted-foreground">
						Consultants currently on shift
					</p>

					<div className="grid grid-cols-2 gap-3">
						{consultants.map((c) => (
							<ConsultantCard
								key={c.personId}
								name={c.fullName}
								imageUrl={c.profileImageUrl}
							/>
						))}
					</div>
				</>
			) : (
				<p className="text-center text-muted-foreground">
					No consultants are currently on shift.
				</p>
			)}

			<KioskButton onClick={onDone}>Return to Sign In</KioskButton>
		</div>
	)
}
