// app/(print)/shifts/summary/page.tsx
import { headers } from 'next/headers'
import { format } from 'date-fns'
import { ShiftSummaryPrint } from '@/components/reports/ShiftSummaryPrint'
import type { DateRangePreset, ShiftSummaryPoint } from '@/types/shift-report'

type Props = {
	searchParams: Promise<{ header?: string }>
}

const PRESETS: { preset: DateRangePreset; title: string }[] = [
	{ preset: 'wtd', title: 'Week to Date' },
	{ preset: 'lastWeek', title: 'Last Week' },
	{ preset: 'mtd', title: 'Month to Date' },
	{ preset: 'lastMonth', title: 'Last Month' },
	{ preset: 'ytd', title: 'Year to Date' },
	{ preset: 'lastYear', title: 'Last Year' },
]

export default async function ShiftSummaryPrintPage({ searchParams }: Props) {
	const { header } = await searchParams
	const headerTrimmed =
		header?.trim() ||
		`Shift Summary as of ${format(new Date(), 'MMMM d, yyyy')}`

	const headersList = await headers()
	const host = headersList.get('host')
	const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
	if (!host) throw new Error('Missing host header')

	async function load(preset: DateRangePreset): Promise<ShiftSummaryPoint[]> {
		const res = await fetch(
			`${protocol}://${host}/api/reports/shifts/summary?preset=${preset}`,
			{
				cache: 'no-store',
			}
		)
		if (!res.ok) return []
		const json = await res.json()
		return json.summary ?? []
	}

	const blocks = await Promise.all(
		PRESETS.map(async (p) => ({
			...p,
			data: await load(p.preset),
		}))
	)

	return (
		<html>
			<head>
				<title>{headerTrimmed}</title>
				<style>{`
  @page {
    size: portrait;
    margin: 0.5in;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    font-size: 11px;
  }

  h1 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  h2 {
    margin: 6px 0 4px;
    font-size: 13px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .chartCard {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 8px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .chartWrap {
    width: 100%;
  }
`}</style>
				<script
					dangerouslySetInnerHTML={{
						__html: `
(function waitForCharts() {
  const root = document.getElementById('print-ready');
  if (!root) {
    requestAnimationFrame(waitForCharts);
    return;
  }

  const svgs = root.querySelectorAll('svg');
  if (svgs.length < 6) { // number of charts expected
    requestAnimationFrame(waitForCharts);
    return;
  }

  // Let layout + fonts settle
  // If uncommented, this auto forwards to color instead.  No good way to auto bring up the print dialog with the conditional coloring
//   setTimeout(() => {
//     window.print();
//     window.onafterprint = () => window.close();
//   }, 400);
// })();
`,
					}}
				/>
			</head>
			<body>
				<ShiftSummaryPrint header={headerTrimmed} blocks={blocks} />
			</body>
		</html>
	)
}
