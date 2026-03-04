import {
	Document,
	Page,
	StyleSheet,
	Text,
	View,
	renderToBuffer,
} from '@react-pdf/renderer'
import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	startOfMonth,
	startOfWeek,
} from 'date-fns'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { listCalendarPrintData } from '@/db/queries/calendar-print'
import { formatInTz } from '@/utils/time'

type DayItem = {
	id: string
	date: string
	time: string
	title: string
	detail: string | null
	isClosure?: boolean
}

const styles = StyleSheet.create({
	page: {
		paddingTop: 18,
		paddingHorizontal: 16,
		paddingBottom: 12,
		fontSize: 8,
		fontFamily: 'Helvetica',
	},
	header: {
		marginBottom: 8,
		alignItems: 'center',
	},
	title: { fontSize: 30, fontWeight: 700, lineHeight: 1 },
	subtitle: { fontSize: 16, marginTop: 2, color: '#444' },
	table: { borderWidth: 1, borderColor: '#7a7a7a' },
	headRow: { flexDirection: 'row', height: 24 },
	headCell: {
		flex: 1,
		borderRightWidth: 1,
		borderRightColor: '#7a7a7a',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	headCellLast: { borderRightWidth: 0 },
	headText: { fontSize: 10, fontWeight: 700 },
	weekRow: {
		flexDirection: 'row',
		minHeight: 96,
		borderTopWidth: 1,
		borderTopColor: '#9a9a9a',
	},
	dayCell: {
		flex: 1,
		borderRightWidth: 1,
		borderRightColor: '#9a9a9a',
		padding: 3,
	},
	dayCellLast: { borderRightWidth: 0 },
	inactiveDay: { backgroundColor: '#eeeeee' },
	dayNumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
	dayNum: { fontSize: 8, fontWeight: 700 },
	closureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#666' },
	item: {
		borderWidth: 1,
		borderColor: '#a7a7a7',
		borderRadius: 2,
		paddingHorizontal: 2,
		paddingVertical: 1,
		marginBottom: 2,
	},
	itemClosure: { backgroundColor: '#f1f1f1' },
	itemText: { fontSize: 7.2, lineHeight: 1.25 },
	itemTime: { fontWeight: 700 },
	moreText: { fontSize: 7, color: '#555' },
})

function ymd(date: Date) {
	return format(date, 'yyyy-MM-dd')
}

function SchedulePdf({ monthDate, itemsByDate }: { monthDate: Date; itemsByDate: Map<string, DayItem[]> }) {
	const monthLabel = format(monthDate, 'MMMM yyyy')
	const monthStart = startOfMonth(monthDate)
	const monthEnd = endOfMonth(monthDate)
	const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
	const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
	const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

	const weeks: Date[][] = []
	for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

	return (
		<Document>
			<Page size="LETTER" orientation="landscape" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.title}>{monthLabel}</Text>
					<Text style={styles.subtitle}>Class Schedule</Text>
				</View>

				<View style={styles.table}>
					<View style={styles.headRow}>
						{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
							const headCellStyle =
								index === 6
									? [styles.headCell, styles.headCellLast]
									: styles.headCell
							return (
								<View key={day} style={headCellStyle}>
									<Text style={styles.headText}>{day}</Text>
								</View>
							)
						})}
					</View>

					{weeks.map((week, weekIndex) => (
						<View key={`week-${weekIndex}`} style={styles.weekRow}>
							{week.map((day, dayIndex) => {
								const key = ymd(day)
								const events = itemsByDate.get(key) ?? []
								const inMonth = isSameMonth(day, monthDate)
								const visible = events.slice(0, 4)
								const hasClosure = events.some((event) => event.isClosure)
								return (
									<View
										key={key}
										style={
											dayIndex === 6
												? !inMonth
													? [styles.dayCell, styles.dayCellLast, styles.inactiveDay]
													: [styles.dayCell, styles.dayCellLast]
												: !inMonth
													? [styles.dayCell, styles.inactiveDay]
													: styles.dayCell
										}
									>
										<View style={styles.dayNumRow}>
											<Text style={styles.dayNum}>{format(day, 'd')}</Text>
											{inMonth && hasClosure ? <View style={styles.closureDot} /> : null}
										</View>

										{visible.map((item) => (
											<View
												key={item.id}
												style={
													item.isClosure
														? [styles.item, styles.itemClosure]
														: styles.item
												}
											>
												<Text style={styles.itemText}>
													<Text style={styles.itemTime}>{item.time}</Text>{' '}
													{item.title}
													{item.detail ? ` - ${item.detail}` : ''}
												</Text>
											</View>
										))}

										{events.length > visible.length ? (
											<Text style={styles.moreText}>
												+{events.length - visible.length} more
											</Text>
										) : null}
									</View>
								)
							})}
						</View>
					))}
				</View>
			</Page>
		</Document>
	)
}

export async function renderNewsletterMonthlySchedulePdf(month: string) {
	if (!/^\d{4}-\d{2}$/.test(month)) {
		throw new Error('Invalid schedule month format.')
	}

	const centerTime = await getCenterTimeConfig()
	const data = await listCalendarPrintData({
		month,
		centerTimeZone: centerTime.timeZone,
		includeClasses: true,
		includeReservations: false,
		classPresenter: null,
		classLocation: null,
		reservationResource: null,
		reservationStatuses: ['confirmed'],
		canViewUnconfirmedReservations: false,
	})

	const rows: DayItem[] = [
		...data.classes.map((event) => ({
			id: `class:${event.id}`,
			date: event.date,
			time: formatInTz(new Date(event.startsAtIso), centerTime.timeZone, 'h:mm a'),
			title: `${event.title}${event.isCanceled ? ' (Canceled)' : ''}`,
			detail:
				event.presenters.length > 0
					? `${event.location} - ${event.presenters.join(', ')}`
					: event.location,
		})),
		...data.closures.map((event) => ({
			id: `closure:${event.id}`,
			date: event.date,
			time: 'Closed',
			title: 'Center Closure',
			detail: event.reason ?? null,
			isClosure: true,
		})),
	].sort((a, b) =>
		a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
	)

	const itemsByDate = new Map<string, DayItem[]>()
	for (const row of rows) {
		const bucket = itemsByDate.get(row.date) ?? []
		bucket.push(row)
		itemsByDate.set(row.date, bucket)
	}

	const [year, monthNumber] = month.split('-').map(Number)
	const monthDate = new Date(year, monthNumber - 1, 1)

	const buffer = await renderToBuffer(
		<SchedulePdf monthDate={monthDate} itemsByDate={itemsByDate} />
	)

	return {
		filename: `monthly-class-schedule-${month}.pdf`,
		content: buffer.toString('base64'),
		contentType: 'application/pdf',
	}
}
