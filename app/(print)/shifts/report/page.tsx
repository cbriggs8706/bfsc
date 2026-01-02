// app/(print)/shifts/report/page.tsx
import { ShiftReportPrint } from '@/components/reports/ShiftReportPrint'
import { getShiftReportDay } from '@/db/queries/shifts/shift-report-day'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { formatInTz } from '@/utils/time'

type Props = {
	searchParams: Promise<{
		date?: string
		header?: string
	}>
}

//CORRECTED TIMEZONE

export default async function ShiftReportPrintPage({ searchParams }: Props) {
	const { date, header } = await searchParams

	const centerTime = await getCenterTimeConfig()

	const dayUtc = date ? new Date(`${date}T12:00:00Z`) : new Date()

	const headerTrimmed =
		header?.trim() ??
		`Shift Report – ${formatInTz(
			dayUtc,
			centerTime.timeZone,
			centerTime.dateFormat
		)}`

	const dateStr =
		date ?? formatInTz(new Date(), centerTime.timeZone, 'yyyy-MM-dd')

	const data = await getShiftReportDay(dateStr, centerTime.timeZone)

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
					centerTime={centerTime}
					// report={data.report}
					shifts={data.shifts}
					offShift={data.offShift}
				/>
			</body>
		</html>
	)
}
