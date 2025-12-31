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

	const regularShifts = shifts.filter((s) => s.type !== 'appointment')
	const appointmentShifts = shifts.filter((s) => s.type === 'appointment')

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

          .page-break {
            page-break-before: always;
          }
        `}</style>
			</head>
			<body>
				{/* =============================
            PAGE 1 — REGULAR SHIFTS
           ============================= */}
				<ShiftSchedulePrint
					header={headerTrimmed}
					titleSuffix="Regular Shifts"
					days={days}
					shifts={regularShifts}
					assignments={assignments}
					shiftType="regular"
				/>

				{/* =============================
            PAGE BREAK
           ============================= */}
				<div className="page-break" />

				{/* =============================
            PAGE 2 — APPOINTMENT SHIFTS
           ============================= */}
				<ShiftSchedulePrint
					header={headerTrimmed}
					titleSuffix="By Appointment Only"
					days={days}
					shifts={appointmentShifts}
					assignments={assignments}
					shiftType="appointment"
				/>
			</body>
		</html>
	)
}
