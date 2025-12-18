// components/kiosk/ShiftStep.tsx
'use client'

import { cn } from '@/lib/utils'
import { KioskButton } from './KioskButton'
import { toAmPm } from '@/utils/time'

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
		<div className="space-y-6">
			<p className="text-xl text-center font-semibold">
				What time do you expect to leave today?
			</p>

			{/* Preset time buttons */}
			<div className="max-h-56 overflow-y-auto grid grid-cols-3 gap-3">
				{timeSlots.map((t) => {
					const selected = expectedDeparture === t

					return (
						<KioskButton
							key={t}
							variant={selected ? 'default' : 'outline'}
							onClick={() => setExpectedDeparture(t)} // ✅ keep HH:MM
						>
							{toAmPm(t)} {/* ✅ display only */}
						</KioskButton>
					)
				})}
			</div>

			{/* Divider */}
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border" />
				<span className="text-sm text-muted-foreground">or</span>
				<div className="h-px flex-1 bg-border" />
			</div>

			{/* Manual time entry */}
			<div className="space-y-2">
				<label className="text-sm font-medium">Enter a custom time</label>
				<input
					type="time"
					className="w-full h-14 rounded-xl border px-4 text-lg"
					value={expectedDeparture}
					onChange={(e) => setExpectedDeparture(e.target.value)}
				/>
			</div>

			<KioskButton
				disabled={!expectedDeparture}
				onClick={onSubmit}
				className="h-14 text-lg"
			>
				Start my shift
			</KioskButton>
		</div>
	)
}
