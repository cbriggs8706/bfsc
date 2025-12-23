'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { DateRangePreset, ShiftSummaryPoint } from '@/types/shift-report'
import { useEffect, useState } from 'react'

function parseLabel(label: string) {
	if (/^\d{4}-\d{2}$/.test(label)) {
		const [y, m] = label.split('-').map(Number)
		return new Date(y, m - 1, 1)
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
		const [y, m, d] = label.split('-').map(Number)
		return new Date(y, m - 1, d)
	}
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

type Block = {
	preset: DateRangePreset
	title: string
	data: ShiftSummaryPoint[]
}

export function ShiftSummaryPrint({
	header,
	blocks,
}: {
	header: string
	blocks: Block[]
}) {
	const [isPrint, setIsPrint] = useState(false)

	useEffect(() => {
		const before = () => setIsPrint(true)
		const after = () => setIsPrint(false)

		window.addEventListener('beforeprint', before)
		window.addEventListener('afterprint', after)

		return () => {
			window.removeEventListener('beforeprint', before)
			window.removeEventListener('afterprint', after)
		}
	}, [])

	return (
		<div id="print-ready" style={{ padding: 16 }}>
			<h1 className="text-2xl font-bold">{header}</h1>

			<div className="grid">
				{blocks.map((b) => (
					<div key={b.preset} className="chartCard">
						<h2 className="font-bold">{b.title}</h2>

						{!b.data || b.data.length === 0 ? (
							<p style={{ color: '#666' }}>No data.</p>
						) : (
							<div className="chartWrap">
								<BarChart width={360} height={200} data={b.data}>
									<XAxis
										dataKey="label"
										fontSize={12}
										tickFormatter={(l) => formatLabel(l, b.preset)}
									/>
									<YAxis allowDecimals={false} />
									<Tooltip
										labelFormatter={(l) => formatLabel(String(l), b.preset)}
									/>
									{isPrint && (
										<p style={{ fontSize: 10, marginBottom: 4 }}>
											■ Consultants &nbsp;&nbsp; ▧ Patrons
										</p>
									)}

									<defs>
										{/* Solid fill (consultants) */}
										<pattern
											id="solidFill"
											patternUnits="userSpaceOnUse"
											width="1"
											height="1"
										>
											<rect width="1" height="1" fill="#000" />
										</pattern>

										{/* Diagonal hatch (patrons) */}
										<pattern
											id="diagonalHatch"
											patternUnits="userSpaceOnUse"
											width="6"
											height="6"
											patternTransform="rotate(45)"
										>
											<line
												x1="0"
												y1="0"
												x2="0"
												y2="6"
												stroke="#000"
												strokeWidth="2"
											/>
										</pattern>
									</defs>

									<Bar
										dataKey="consultants"
										stackId="a"
										fill={isPrint ? 'url(#solidFill)' : 'var(--chart-2)'}
									/>

									<Bar
										dataKey="patrons"
										stackId="a"
										fill={isPrint ? 'url(#diagonalHatch)' : 'var(--chart-1)'}
									/>
								</BarChart>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
