// components/reports/ShiftReportPrint.tsx
import type {
	ShiftReportWorker,
	ShiftReportItem,
	ShiftReportPatron,
	TodayShift,
} from '@/types/shift-report'
import { toAmPm } from '@/utils/time'
import { format } from 'date-fns'
import React from 'react'

type Props = {
	header: string
	date: string
	shifts: TodayShift[]
	offShift: TodayShift[]
}

export function ShiftReportPrint({ header, date, shifts, offShift }: Props) {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold">{header}</h1>

			{shifts.length === 0 && <p>No shifts scheduled for this day.</p>}

			{shifts.map((shift) => {
				const sortedReservations = [...shift.reservations].sort((a, b) =>
					a.startTime.localeCompare(b.startTime)
				)
				return (
					<React.Fragment key={shift.shiftId}>
						<section>
							<h2 className="text-lg font-semibold">
								{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
							</h2>

							<p>
								<strong>Workers:</strong>{' '}
								{shift.workers.map((c) => c.fullName).join(', ') || '—'}
							</p>

							<table>
								<thead>
									<tr>
										<th>Patron</th>
										<th>Purpose</th>
										<th>Arrived</th>
									</tr>
								</thead>
								<tbody>
									{shift.patrons.map((p) => (
										<tr key={p.visitId}>
											<td>{p.fullName}</td>
											<td>{p.purposeName}</td>
											<td>{format(new Date(p.arrivedAt), 'h:mm a')}</td>
										</tr>
									))}
								</tbody>
							</table>

							{shift.reservations.length > 0 && (
								<>
									<h4 className="mt-4 font-semibold">Reservations</h4>

									<table>
										<thead>
											<tr>
												<th>Patron</th>
												<th>Resource</th>
												<th>Time</th>
												<th>Status</th>
											</tr>
										</thead>
										<tbody>
											{sortedReservations.map((r) => (
												<tr key={r.id}>
													<td>{r.patronName}</td>
													<td>{r.resourceName}</td>
													<td>
														{toAmPm(r.startTime)} – {toAmPm(r.endTime)}
													</td>
													<td>{r.status}</td>
												</tr>
											))}
										</tbody>
									</table>
								</>
							)}
						</section>
					</React.Fragment>
				)
			})}

			{offShift.length > 0 && (
				<>
					{offShift.map((shift) => (
						<section key={shift.shiftId}>
							<h3 className="text-lg font-semibold">Off Shift</h3>

							<p>
								<strong>Workers:</strong>{' '}
								{shift.workers.map((c) => c.fullName).join(', ') || '—'}
							</p>

							<table>
								<thead>
									<tr>
										<th>Patron</th>
										<th>Purpose</th>
										<th>Arrived</th>
									</tr>
								</thead>
								<tbody>
									{shift.patrons.map((p) => (
										<tr key={p.visitId}>
											<td>{p.fullName}</td>
											<td>{p.purposeName ?? '—'}</td>
											<td>{format(new Date(p.arrivedAt), 'h:mm a')}</td>
										</tr>
									))}
								</tbody>
							</table>
						</section>
					))}
				</>
			)}
		</div>
	)
}
