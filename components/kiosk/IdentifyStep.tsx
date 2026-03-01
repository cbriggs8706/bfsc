// components/kiosk/IdentifyStep.tsx
'use client'

import { PersonSummary } from '@/types/kiosk'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	input: string
	suggestions: PersonSummary[]
	searching: boolean
	onInputChange: (value: string) => void
	onSelectSuggestion: (p: PersonSummary) => void
}

export function IdentifyStep({
	input,
	suggestions,
	searching,
	onInputChange,
	onSelectSuggestion,
}: Props) {
	return (
		<div className="space-y-3">
			<KioskInput
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
			/>

			<div className="h-44 md:h-48 rounded-xl border bg-background overflow-hidden">
				<div className="h-full overflow-y-auto p-2 space-y-2">
					{searching && (
						<p className="text-2xl px-2 text-center mt-10">Searching…</p>
					)}

					{!searching && suggestions.length === 0 && (
						<div className="mt-6 text-center space-y-3 px-2">
							<p className="text-2xl font-semibold">
								Burley FamilySearch Center Login
							</p>
							<p className="text-2xl">
								{input.trim().length < 2
									? 'Start typing your name'
									: 'No record found yet. Finish typing your full name, then tap Continue.'}
							</p>
						</div>
					)}

					{suggestions.map((s) => (
						<KioskButton
							key={s.id}
							variant="secondary"
							className="justify-start w-full"
							onClick={() => onSelectSuggestion(s)}
						>
							{s.fullName}
						</KioskButton>
					))}
				</div>
			</div>
		</div>
	)
}
