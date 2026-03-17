import { getServerSession } from 'next-auth/next'
import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	startOfMonth,
	startOfWeek,
} from 'date-fns'

import { authOptions } from '@/lib/auth'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { getCenterProfile } from '@/lib/actions/center/center'
import { listCalendarPrintData } from '@/db/queries/calendar-print'
import { formatInTz } from '@/utils/time'

type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

type Props = {
	searchParams: Promise<{
		month?: string
		includeClasses?: string
		includeReservations?: string
		classPresenter?: string
		classLocation?: string
		reservationResource?: string
		reservationStatuses?: string
	}>
}

const PRIVILEGED_RESERVATION_ROLES = new Set([
	'Admin',
	'Director',
	'Assistant Director',
	'Shift Leader',
])

function statusLabel(status: ReservationStatus) {
	if (status === 'pending') return 'Tentative'
	if (status === 'confirmed') return 'Confirmed'
	if (status === 'denied') return 'Denied'
	return 'Cancelled'
}

function parseStatuses(raw: string | undefined): ReservationStatus[] {
	const values = (raw ?? '')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
		.filter(
			(value): value is ReservationStatus =>
				value === 'pending' ||
				value === 'confirmed' ||
				value === 'denied' ||
				value === 'cancelled'
		)
	return values.length > 0 ? values : ['confirmed']
}

type PrintItem = {
	id: string
	kind: 'class' | 'reservation' | 'closure'
	startsAtIso: string
	timeLabel: string
	title: string
	presenterLine: string
	locationText: string
	reservationDetail: string
}

export default async function CalendarPrintPage({ searchParams }: Props) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return (
			<html>
				<body>
					<p style={{ padding: 24 }}>Sign in to print the calendar.</p>
				</body>
			</html>
		)
	}

	const params = await searchParams
	const centerTime = await getCenterTimeConfig()
	const center = await getCenterProfile()

	const monthParam =
		params.month && /^\d{4}-\d{2}$/.test(params.month)
			? params.month
			: format(new Date(), 'yyyy-MM')

	const [year, month] = monthParam.split('-').map(Number)
	const monthDate = new Date(year, month - 1, 1)

	const includeClasses = params.includeClasses !== '0'
	const includeReservations = params.includeReservations !== '0'

	const requestedStatuses = parseStatuses(params.reservationStatuses)
	const canViewUnconfirmedReservations = PRIVILEGED_RESERVATION_ROLES.has(
		session.user.role ?? 'Patron'
	)

	const data = await listCalendarPrintData({
		month: monthParam,
		centerTimeZone: centerTime.timeZone,
		includeClasses,
		includeReservations,
		classPresenter: params.classPresenter ?? null,
		classLocation: params.classLocation ?? null,
		reservationResource: params.reservationResource ?? null,
		reservationStatuses: requestedStatuses,
		canViewUnconfirmedReservations,
	})

	const monthHeader = format(monthDate, 'MMMM yyyy')
	const monthStart = startOfMonth(monthDate)
	const monthEnd = endOfMonth(monthDate)
	const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
	const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
	const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

	const byDate = new Map<string, PrintItem[]>()

	for (const closure of data.closures) {
		const items = byDate.get(closure.date) ?? []
		items.push({
			id: `closure:${closure.id}`,
			kind: 'closure',
			startsAtIso: `${closure.date}T00:00:00.000Z`,
			timeLabel: 'Closed',
			title: '',
			presenterLine: '',
			locationText: '',
			reservationDetail: closure.reason?.trim() || 'Center Closed',
		})
		byDate.set(closure.date, items)
	}

	if (includeClasses) {
		for (const event of data.classes) {
			const items = byDate.get(event.date) ?? []
			const time = formatInTz(
				new Date(event.startsAtIso),
				centerTime.timeZone,
				'h:mm a'
			)
			const presenters = event.presenters.join(', ') || 'Unassigned'
			items.push({
				id: `class:${event.id}`,
				kind: 'class',
				startsAtIso: event.startsAtIso,
				timeLabel: time,
				title: `${event.title}${event.isCanceled ? ' (Canceled)' : ''}`,
				presenterLine: presenters,
				locationText: event.location,
				reservationDetail: '',
			})
			byDate.set(event.date, items)
		}
	}

	if (includeReservations) {
		for (const event of data.reservations) {
			const items = byDate.get(event.date) ?? []
			const startTime = formatInTz(
				new Date(event.startsAtIso),
				centerTime.timeZone,
				'h:mm a'
			)
			const endTime = formatInTz(
				new Date(event.endsAtIso),
				centerTime.timeZone,
				'h:mm a'
			)
			items.push({
				id: `reservation:${event.id}`,
				kind: 'reservation',
				startsAtIso: event.startsAtIso,
				timeLabel: `${startTime}-${endTime}`,
				title: event.name,
				presenterLine: '',
				locationText: '',
				reservationDetail: `${event.resource} • ${statusLabel(event.status)}`,
			})
			byDate.set(event.date, items)
		}
	}

	for (const [date, items] of byDate.entries()) {
		items.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
		byDate.set(date, items)
	}

	return (
		<html>
			<head>
				<title>{`${monthHeader} Calendar`}</title>
				<style>{`
					@page { size: letter landscape; margin: 0.3in; }
					body {
						margin: 0;
						font-family: ui-sans-serif, system-ui, sans-serif;
						font-size: 11px;
						color: rgb(0 0 0 / 0.9);
					}
					h1, h2, h3, p { margin: 0; }
					.page {
						height: 7.5in;
						display: grid;
						grid-template-rows: auto auto 1fr;
						gap: 0.06in;
					}
					.header { margin-bottom: 0.02in; text-align: center; }
					.title { font-size: 42px; font-weight: 700; line-height: 1; }
					.subline { font-size: 24px; opacity: 0.8; margin-top: 4px; }
					.legend { font-size: 13px; display: flex; gap: 14px; }
					.legendItem { display: inline-flex; align-items: center; gap: 4px; }
					.legendDot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
					.legendDot.class { background: rgb(0 0 0 / 0.9); }
					.legendDot.reservation { background: rgb(0 0 0 / 0.45); }
					.legendDot.closure { background: rgb(0 0 0 / 0.65); }
					.calendarTable {
						width: 100%;
						height: 100%;
						border-collapse: collapse;
						table-layout: fixed;
					}
					.calendarTable thead tr { height: 0.34in; }
					.calendarTable tbody tr { height: calc((100% - 0.34in) / 6); }
					.calendarTable th {
						border: 1px solid rgb(0 0 0 / 0.35);
						font-size: 16px;
						font-weight: 700;
						padding: 2px 3px;
						text-align: left;
					}
					.calendarTable td {
						border: 1px solid rgb(0 0 0 / 0.25);
						vertical-align: top;
						padding: 1px 2px;
						overflow: visible;
					}
					.dayCell.outside { opacity: 0.45; }
					.dayNum { font-size: 14px; font-weight: 700; margin-bottom: 2px; line-height: 1.05; }
					.events {
						list-style: none;
						padding: 0;
						margin: 0;
						display: grid;
						gap: 3px;
					}
					.event {
						font-size: 10px;
						line-height: 1.15;
						padding: 2px 3px;
						border: 0.75px solid rgb(0 0 0 / 0.4);
						border-radius: 6px;
						background: rgb(255 255 255 / 0.9);
					}
					.event.reservation {
						border-color: rgb(0 0 0 / 0.25);
					}
					.event.closure {
						border-color: rgb(0 0 0 / 0.6);
						background: rgb(0 0 0 / 0.06);
					}
					.line {
						white-space: normal;
						overflow-wrap: anywhere;
						word-break: break-word;
						text-overflow: clip;
					}
					.linePrimary { font-size: 10px; }
					.time { font-weight: 700; }
					.classTitle {
						font-size: 15px;
						font-weight: 700;
						line-height: 1.08;
						display: inline;
					}
					.presenter {
						font-size: 15px;
						font-weight: 400;
						line-height: 1.08;
						display: block;
						margin-top: 1px;
					}
					.inlineLocation {
						font-size: 10px;
						font-weight: 400;
						opacity: 0.85;
						display: block;
						margin-top: 1px;
					}
					.more {
						font-size: 10px;
						opacity: 0.7;
						padding-left: 1px;
					}
				`}</style>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							window.addEventListener('load', () => {
								setTimeout(() => window.print(), 250);
							});
						`,
					}}
				/>
			</head>
			<body>
				<div className="page">
					<div className="header">
						<h1 className="title">{monthHeader}</h1>
						<p className="subline">{center.name || 'FamilySearch Center'}</p>
					</div>
					<div className="legend">
						{includeClasses && (
							<span className="legendItem">
								<span className="legendDot class" />
								Classes
							</span>
						)}
						{includeReservations && (
							<span className="legendItem">
								<span className="legendDot reservation" />
								Reservations
							</span>
						)}
						<span className="legendItem">
							<span className="legendDot closure" />
							Closures
						</span>
					</div>

					<table className="calendarTable" aria-label={`${monthHeader} calendar`}>
						<thead>
							<tr>
								{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
									(dayName) => (
										<th key={dayName}>{dayName}</th>
									)
								)}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: Math.ceil(days.length / 7) }).map(
								(_, weekIndex) => (
									<tr key={weekIndex}>
										{days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => {
											const key = format(day, 'yyyy-MM-dd')
											const inMonth = isSameMonth(day, monthDate)
											const events = byDate.get(key) ?? []
											const shown = events.slice(0, 3)
											const hiddenCount = events.length - shown.length

											return (
												<td
													key={key}
													className={`dayCell ${inMonth ? '' : 'outside'}`.trim()}
												>
													<div className="dayNum">{format(day, 'd')}</div>
													<ul className="events">
														{shown.map((item) => (
															<li
																key={item.id}
																className={`event ${item.kind}`.trim()}
															>
																{item.kind === 'class' ? (
																	<>
																		<div className="line linePrimary">
																			<span className="time classTitle">
																				{item.timeLabel}{' '}
																			</span>
																			<span className="classTitle">{item.title}</span>
																		</div>
																		<div className="line presenter">{item.presenterLine}</div>
																		<div className="line inlineLocation">
																			{item.locationText}
																		</div>
																	</>
																) : item.kind === 'reservation' ? (
																	<div className="line linePrimary">
																		<span className="time">{item.timeLabel} </span>
																		<span>{item.title}</span>
																	</div>
																) : (
																	<div className="line linePrimary">
																		<span className="time">{item.timeLabel}</span>
																	</div>
																)}
																{(item.kind === 'reservation' ||
																	item.kind === 'closure') && (
																	<div className="line">{item.reservationDetail}</div>
																)}
															</li>
														))}
														{hiddenCount > 0 && (
															<li className="more">+{hiddenCount} more</li>
														)}
													</ul>
												</td>
											)
										})}
									</tr>
								)
							)}
						</tbody>
					</table>
				</div>
			</body>
		</html>
	)
}
