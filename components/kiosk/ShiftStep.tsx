// components/kiosk/ShiftStep.tsx
'use client'

import { KioskButton } from './KioskButton'

type Props = {
	timeSlots: string[]
	expectedDeparture: string
	setExpectedDeparture: (v: string) => void
	onSubmit: () => void
}

export function ShiftStep({
	timeSlots,
	expectedDeparture,
	setExpectedDeparture,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<p className="text-xl text-center font-semibold">
				What time do you expect to leave today?
			</p>

			<div className="max-h-64 overflow-y-auto grid grid-cols-3 gap-3">
				{timeSlots.map((t) => (
					<KioskButton
						key={t}
						variant={expectedDeparture === t ? 'default' : 'outline'}
						onClick={() => setExpectedDeparture(t)}
					>
						{t}
					</KioskButton>
				))}
			</div>

			<KioskButton disabled={!expectedDeparture} onClick={onSubmit}>
				Start my shift
			</KioskButton>
		</div>
	)
}
