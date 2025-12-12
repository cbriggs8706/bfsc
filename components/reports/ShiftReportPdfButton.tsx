// components/reports/ShiftReportPdfButton.tsx
'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { ShiftReportPDF } from './ShiftReportPdf'
import type { ShiftSlotReport, DateRange } from '@/types/shift-report'

export function ShiftReportPdfButton({
	data,
	range,
	fileName,
}: {
	data: ShiftSlotReport[]
	range: DateRange
	fileName: string
}) {
	return (
		<PDFDownloadLink
			document={<ShiftReportPDF data={data} range={range} />}
			fileName={fileName}
		>
			{({ loading }) => (
				<Button variant="secondary" disabled={loading || data.length === 0}>
					{loading ? 'Preparing PDF…' : 'Export PDF'}
				</Button>
			)}
		</PDFDownloadLink>
	)
}
