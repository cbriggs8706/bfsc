// components/reports/ShiftReportPrint.tsx
import type { TodayShift } from '@/types/shift-report'
import { TimeFormat } from '@/types/shifts'
import { formatInTz, formatTimeRange } from '@/utils/time'
import React from 'react'

type Props = {
	header: string
	shifts: TodayShift[]
	offShift: TodayShift[]
	centerTime: {
		timeZone: string
		timeFormat: TimeFormat
		dateFormat: string
	}
}

//CORRECTED TIMEZONE

export function ShiftReportPrint({
	header,
	shifts,
	offShift,
	centerTime,
}: Props) {
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
								{formatTimeRange(
									shift.startTime,
									shift.endTime,
									centerTime.timeFormat
								)}
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
											<td>
												{formatInTz(
													new Date(p.arrivedAt),
													centerTime.timeZone,
													centerTime.timeFormat
												)}
											</td>
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
														{formatTimeRange(
															r.startTime,
															r.endTime,
															centerTime.timeFormat
														)}
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
											<td>
												{formatInTz(
													new Date(p.arrivedAt),
													centerTime.timeZone,
													centerTime.timeFormat
												)}
											</td>
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
