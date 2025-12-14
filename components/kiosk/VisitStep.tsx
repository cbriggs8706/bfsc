// components/kiosk/VisitStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectValue,
	SelectItem,
} from '@/components/ui/select'
import { Purpose } from '@/types/kiosk'
import { KioskButton } from './KioskButton'

type Props = {
	purposes: Purpose[]
	selectedPurposeId: string
	mailingOptIn: boolean
	setSelectedPurposeId: (v: string) => void
	setMailingOptIn: (v: boolean) => void
	onSubmit: () => void
}

export function VisitStep({
	purposes,
	selectedPurposeId,
	mailingOptIn,
	setSelectedPurposeId,
	setMailingOptIn,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<div>
				<Label className="text-lg">Reason for your visit</Label>
				<Select value={selectedPurposeId} onValueChange={setSelectedPurposeId}>
					<SelectTrigger className="h-14 text-lg rounded-xl">
						<SelectValue placeholder="Choose one" />
					</SelectTrigger>
					<SelectContent>
						{purposes.map((p) => (
							<SelectItem key={p.id} value={String(p.id)}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<label className="flex items-center gap-3 text-lg">
				<input
					type="checkbox"
					checked={mailingOptIn}
					onChange={(e) => setMailingOptIn(e.target.checked)}
				/>
				I’d like to receive emails about classes and events
			</label>

			<KioskButton onClick={onSubmit}>Sign me in</KioskButton>
		</div>
	)
}
