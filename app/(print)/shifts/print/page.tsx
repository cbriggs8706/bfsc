// app/(print)/shifts/print/page.tsx
import { ShiftSchedulePrint } from '@/components/admin/shift/ShiftSchedulePrint'
import { getShiftPrintData } from '@/db/queries/shifts-print'

type Props = {
	searchParams: Promise<{
		header?: string
	}>
}

export default async function ShiftPrintPage({ searchParams }: Props) {
	const { header } = await searchParams
	const { days, shifts, assignments } = await getShiftPrintData()

	const headerTrimmed = header?.trim() || 'Shift Assignments'

	return (
		<html>
			<head>
				<title>{headerTrimmed}</title>
				<style>{`
          @page {
            size: landscape;
            margin: 0.5in;
          }

          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            font-size: 10px;
          }
        `}</style>
			</head>
			<body>
				<ShiftSchedulePrint
					header={headerTrimmed}
					days={days}
					shifts={shifts}
					assignments={assignments}
				/>
			</body>
		</html>
	)
}
