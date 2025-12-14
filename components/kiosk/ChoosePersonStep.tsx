// components/kiosk/ChoosePersonStep.tsx
'use client'

import { PersonSummary } from '@/types/kiosk'
import { KioskButton } from './KioskButton'

type Props = {
	matches: PersonSummary[]
	onChoose: (person: PersonSummary) => void
	onCreateNew: () => void
}

export function ChoosePersonStep({ matches, onChoose, onCreateNew }: Props) {
	return (
		<div className="space-y-4">
			<p className="text-lg">
				We found several matches. Please choose your name:
			</p>

			<div className="space-y-2 max-h-64 overflow-y-auto">
				{matches.map((p) => (
					<KioskButton
						key={p.id}
						variant="outline"
						className="justify-between"
						onClick={() => onChoose(p)}
					>
						<span>{p.fullName}</span>
						{p.isConsultant && (
							<span className="text-sm text-muted-foreground">Consultant</span>
						)}
					</KioskButton>
				))}
			</div>

			<KioskButton variant="ghost" onClick={onCreateNew}>
				I don’t see my name
			</KioskButton>
		</div>
	)
}
