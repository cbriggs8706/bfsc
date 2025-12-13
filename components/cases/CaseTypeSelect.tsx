// components/cases/CaseTypeSelect.tsx
'use client'

import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'

type CaseType = {
	id: string
	name: string
	icon?: string | null
}

export function CaseTypeSelect({
	value,
	onChange,
	options,
}: {
	value: string
	onChange: (id: string) => void
	options: CaseType[]
}) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select case type" />
			</SelectTrigger>

			<SelectContent>
				{options.map((t) => (
					<SelectItem key={t.id} value={t.id}>
						<span className="flex gap-2">
							{t.icon && <span>{t.icon}</span>}
							{t.name}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
