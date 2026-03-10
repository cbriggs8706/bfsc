'use client'

import { Label } from '@/components/ui/label'
import { KioskButton } from './KioskButton'

type Props = {
	attendeeCount: number
	setAttendeeCount: (value: number) => void
	onSubmit: () => void
}

export function MissionariesStep({
	attendeeCount,
	setAttendeeCount,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<p className="text-xl font-semibold">Missionaries</p>

			<div className="space-y-2">
				<Label className="text-lg">How many are with you today?</Label>
				<input
					type="number"
					min={0}
					step={1}
					className="w-full rounded-md border bg-background p-3 text-lg"
					value={attendeeCount}
					onChange={(e) => {
						const parsed = Number(e.target.value)
						setAttendeeCount(Number.isFinite(parsed) ? parsed : 0)
					}}
				/>
			</div>

			<KioskButton onClick={onSubmit}>Submit</KioskButton>
		</div>
	)
}
