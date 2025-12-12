// components/custom/DateRangeButtons.tsx

'use client'

import { Button } from '@/components/ui/button'
import type { DateRangePreset } from '@/types/shift-report'

const OPTIONS: { key: DateRangePreset; label: string }[] = [
	{ key: 'wtd', label: 'Week to Date' },
	{ key: 'lastWeek', label: 'Last Week' },
	{ key: 'mtd', label: 'Month to Date' },
	{ key: 'lastMonth', label: 'Last Month' },
	{ key: 'ytd', label: 'Year to Date' },
	{ key: 'lastYear', label: 'Last Year' },
]

export function DateRangeButtons({
	value,
	onChange,
}: {
	value: DateRangePreset
	onChange: (v: DateRangePreset) => void
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{OPTIONS.map((o) => (
				<Button
					key={o.key}
					variant={value === o.key ? 'default' : 'outline'}
					onClick={() => onChange(o.key)}
				>
					{o.label}
				</Button>
			))}
		</div>
	)
}
