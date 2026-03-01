'use client'

import { KioskButton } from './KioskButton'

const TOP_ROW = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const SECOND_ROW = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const THIRD_ROW = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

type Props = {
	onKey: (char: string) => void
	onBackspace: () => void
	onClear: () => void
	onSpace: () => void
	onContinue: () => void
	canContinue: boolean
}

export function OnScreenKeyboard({
	onKey,
	onBackspace,
	onClear,
	onSpace,
	onContinue,
	canContinue,
}: Props) {
	return (
		<div className="select-none space-y-2">
			<div className="grid grid-cols-10 gap-2 w-full">
				{TOP_ROW.map((k) => (
					<KioskButton
						key={k}
						variant="outline"
						className="!w-full h-14 md:h-16 text-xl md:text-2xl"
						onClick={() => onKey(k)}
					>
						{k}
					</KioskButton>
				))}
			</div>

			<div className="grid grid-cols-9 gap-2 w-full">
				{SECOND_ROW.map((k) => (
					<KioskButton
						key={k}
						variant="outline"
						className="!w-full h-14 md:h-16 text-xl md:text-2xl"
						onClick={() => onKey(k)}
					>
						{k}
					</KioskButton>
				))}
			</div>

			<div className="grid grid-cols-7 gap-2 w-full">
				{THIRD_ROW.map((k) => (
					<KioskButton
						key={k}
						variant="outline"
						className="!w-full h-14 md:h-16 text-xl md:text-2xl"
						onClick={() => onKey(k)}
					>
						{k}
					</KioskButton>
				))}
			</div>

			<div className="grid grid-cols-4 gap-2 w-full">
				<KioskButton
					variant="outline"
					className="!w-full h-14 md:h-16 text-xl md:text-2xl font-semibold"
					onClick={onSpace}
				>
					Space
				</KioskButton>

				<KioskButton
					variant="destructive"
					className="!w-full h-14 md:h-16 text-xl md:text-2xl"
					onClick={onClear}
				>
					Clear
				</KioskButton>

				<KioskButton
					className="!w-full h-14 md:h-16 text-xl md:text-2xl font-bold tracking-wide shadow-md"
					onClick={onContinue}
					disabled={!canContinue}
				>
					Continue
				</KioskButton>
				<KioskButton
					variant="outline"
					className="!w-full h-14 md:h-16 text-xl md:text-2xl"
					onClick={onBackspace}
				>
					⌫
				</KioskButton>
			</div>
		</div>
	)
}
