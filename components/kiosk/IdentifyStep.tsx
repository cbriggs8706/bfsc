// components/kiosk/IdentifyStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { PersonSummary } from '@/types/kiosk'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	input: string
	suggestions: PersonSummary[]
	searching: boolean
	onInputChange: (value: string) => void
	onContinue: () => void
	onSelectSuggestion: (p: PersonSummary) => void
}

export function IdentifyStep({
	input,
	suggestions,
	searching,
	onInputChange,
	onContinue,
	onSelectSuggestion,
}: Props) {
	return (
		<div className="space-y-4">
			<Label className="text-lg">
				Enter your <strong>name</strong> or <strong>6-digit code</strong>
			</Label>

			<KioskInput
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
				autoFocus
			/>

			{suggestions.length > 0 && (
				<div className="space-y-2 max-h-56 overflow-y-auto">
					{suggestions.map((s) => (
						<KioskButton
							key={s.id}
							variant="secondary"
							className="justify-start"
							onClick={() => onSelectSuggestion(s)}
						>
							{s.fullName}
						</KioskButton>
					))}
				</div>
			)}

			{searching && <p className="text-sm text-muted-foreground">Searching…</p>}

			<KioskButton onClick={onContinue}>Continue</KioskButton>
		</div>
	)
}
