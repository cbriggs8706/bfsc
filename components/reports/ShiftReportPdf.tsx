// components/reports/ShiftReportPdf.tsx
'use client'

import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ShiftSlotReport, DateRange } from '@/types/shift-report'

export function ShiftReportPDF({
	range,
	data,
}: {
	range: DateRange
	data: ShiftSlotReport[]
}) {
	return (
		<Document>
			<Page size="LETTER" style={{ padding: 24 }}>
				<Text style={{ fontSize: 14, marginBottom: 8 }}>
					Shift Report — {range.start.toDateString()} to{' '}
					{range.end.toDateString()}
				</Text>

				{data.map((slot) => (
					<View key={slot.slotId} style={{ marginTop: 10 }}>
						<Text style={{ fontSize: 12 }}>
							{slot.date} — {slot.label}
						</Text>
						{slot.notes ? (
							<Text style={{ fontSize: 10, marginTop: 2 }}>
								Notes: {slot.notes}
							</Text>
						) : null}

						<View style={{ marginTop: 6 }}>
							<Text style={{ fontSize: 10 }}>
								Consultants who started in this shift:
							</Text>
							{slot.consultants.length === 0 ? (
								<Text style={{ fontSize: 10 }}>- None</Text>
							) : (
								slot.consultants.map((c) => (
									<Text key={c.kioskShiftLogId} style={{ fontSize: 10 }}>
										- {c.fullName} (
										{new Date(c.arrivalAtIso).toLocaleTimeString()})
									</Text>
								))
							)}
						</View>

						<View style={{ marginTop: 6 }}>
							<Text style={{ fontSize: 10 }}>
								Patrons who signed in during this shift:
							</Text>
							{slot.patrons.length === 0 ? (
								<Text style={{ fontSize: 10 }}>- None</Text>
							) : (
								slot.patrons.map((p) => (
									<Text key={p.visitId} style={{ fontSize: 10 }}>
										- {p.fullName} (
										{new Date(p.createdAtIso).toLocaleTimeString()}) —{' '}
										{p.purposeName ?? 'General'}
									</Text>
								))
							)}
						</View>
					</View>
				))}
			</Page>
		</Document>
	)
}
