// app/(print)/shifts/report/page.tsx
import { ShiftReportPrint } from '@/components/reports/ShiftReportPrint'
import { getShiftReportPrintData } from '@/db/queries/shifts/shift-report-print'
import { format } from 'date-fns'

type Props = {
	searchParams: Promise<{
		date?: string
		header?: string
	}>
}

export default async function ShiftReportPrintPage({ searchParams }: Props) {
	const { date, header } = await searchParams

	const day = date ? new Date(date) : new Date()
	const headerTrimmed =
		header?.trim() || `Shift Report – ${format(day, 'MMMM d, yyyy')}`

	const data = await getShiftReportPrintData(day)

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
            margin-bottom: 12px;
          }

          h2 {
            margin: 10px 0 4px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }

          th, td {
            border-bottom: 1px solid #ddd;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
          }

          th {
            font-weight: 600;
          }
        `}</style>
			</head>
			<body>
				<ShiftReportPrint
					header={headerTrimmed}
					date={data.date}
					report={data.report}
				/>
			</body>
		</html>
	)
}
