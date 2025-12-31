'use client'

import { KioskButton } from './KioskButton'

const LETTERS = '!@0123456ABCDEFGHIJKLMNOPQRSTUVWXYZ?'.split('')

// Phone-style keypad order
const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '*', '0', '#']

type Props = {
	onKey: (char: string) => void
	onBackspace: () => void
	onClear: () => void
}

export function OnScreenKeyboard({ onKey, onBackspace, onClear }: Props) {
	return (
		<div className="select-none space-y-3">
			{/* Main keyboard */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_auto]">
				{/* Alphabet */}
				<div className="grid grid-cols-9 gap-2">
					{LETTERS.map((k) => (
						<KioskButton
							key={k}
							variant="outline"
							className="h-12 sm:h-14 text-lg"
							onClick={() => onKey(k)}
						>
							{k}
						</KioskButton>
					))}
				</div>

				{/* Numeric keypad */}
				<div className="grid grid-cols-3 gap-2">
					{DIGITS.map((d) => (
						<KioskButton
							key={d}
							variant="default"
							className="h-12 sm:h-14 text-lg"
							onClick={() => onKey(d)}
						>
							{d}
						</KioskButton>
					))}
				</div>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-2 gap-2">
				<KioskButton
					variant="outline"
					className="h-12 sm:h-14 text-lg"
					onClick={onBackspace}
				>
					⌫ Backspace
				</KioskButton>

				<KioskButton
					variant="destructive"
					className="h-12 sm:h-14 text-lg"
					onClick={onClear}
				>
					Clear
				</KioskButton>
			</div>
		</div>
	)
}
