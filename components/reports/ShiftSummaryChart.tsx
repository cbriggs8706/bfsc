// components/reports/ShiftSummaryChart.tsx
'use client'

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import type { ShiftSummaryPoint, DateRangePreset } from '@/types/shift-report'

function parseLabel(label: string) {
	// YYYY-MM
	if (/^\d{4}-\d{2}$/.test(label)) {
		const [y, m] = label.split('-').map(Number)
		return new Date(y, m - 1, 1) // local
	}

	// YYYY-MM-DD  ✅ parse as local date (NOT UTC)
	if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
		const [y, m, d] = label.split('-').map(Number)
		return new Date(y, m - 1, d) // local
	}
	console.log(label, parseLabel(label).toString())

	// fallback
	return new Date(label)
}

function formatLabel(label: string, preset: DateRangePreset) {
	const date = parseLabel(label)

	switch (preset) {
		case 'wtd':
		case 'lastWeek':
			return date.toLocaleDateString(undefined, { weekday: 'short' })

		case 'mtd':
		case 'lastMonth':
			return String(date.getDate())

		case 'ytd':
		case 'lastYear':
			return date.toLocaleDateString(undefined, { month: 'short' })

		default:
			return label
	}
}

export function ShiftSummaryChart({
	data,
	preset,
}: {
	data: ShiftSummaryPoint[]
	preset: DateRangePreset
}) {
	if (!data || data.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">No data for this range.</p>
		)
	}

	return (
		<div className="w-full h-[300px] min-h-[300px]">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<XAxis
						dataKey="label"
						type="category"
						allowDuplicatedCategory={false}
						fontSize={12}
						stroke="var(--muted-foreground)"
						tickFormatter={(l) => formatLabel(l, preset)}
					/>
					<YAxis allowDecimals={false} />
					<Tooltip labelFormatter={(l) => formatLabel(l, preset)} />
					<Legend />

					<Bar
						dataKey="consultants"
						stackId="a"
						fill="var(--chart-2)"
						radius={[4, 4, 0, 0]}
					/>
					<Bar
						dataKey="patrons"
						stackId="a"
						fill="var(--chart-1)"
						radius={[4, 4, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
