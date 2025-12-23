// components/reports/ShiftReportPrint.tsx
import type { ShiftReportItem } from '@/types/shift-report'
import { format } from 'date-fns'

type Props = {
	header: string
	date: string // YYYY-MM-DD
	report: ShiftReportItem[]
}

export function ShiftReportPrint({ header, date, report }: Props) {
	return (
		<div>
			<h1>{header}</h1>

			{report.length === 0 && (
				<p>No consultant or patron activity recorded for this day.</p>
			)}

			{report.map(({ consultant, patrons }) => {
				const arrival = new Date(consultant.arrivalAt)
				const departure = new Date(
					consultant.actualDepartureAt ?? consultant.expectedDepartureAt
				)

				return (
					<section key={`${consultant.personId}-${consultant.arrivalAt}`}>
						<h2>{consultant.fullName}</h2>

						<p>
							<strong>Shift:</strong> {format(arrival, 'h:mm a')} –{' '}
							{format(departure, 'h:mm a')}
						</p>

						<table>
							<thead>
								<tr>
									<th>Patron</th>
									<th>Signed In</th>
									<th>Purpose</th>
								</tr>
							</thead>
							<tbody>
								{patrons.map((p) => (
									<tr key={`${p.personId}-${p.signedInAt}`}>
										<td>{p.fullName}</td>
										<td>{format(new Date(p.signedInAt), 'h:mm a')}</td>
										<td>{p.purposeName ?? '—'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
				)
			})}
		</div>
	)
}
