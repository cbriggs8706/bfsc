// lib/shifts/dates.ts
import { addDays, startOfMonth, endOfMonth, getDay, getDate } from 'date-fns'

export function getDatesInRange(start: Date, end: Date): Date[] {
	const dates: Date[] = []
	let current = new Date(start)

	while (current <= end) {
		dates.push(new Date(current))
		current = addDays(current, 1)
	}

	return dates
}

/**
 * Week-of-month (1–5) for recurrence matching
 */
export function getWeekOfMonth(date: Date): number {
	const dayOfMonth = getDate(date)
	return Math.ceil(dayOfMonth / 7)
}

/**
 * Does this date match a recurrence?
 */
export function matchesRecurrence(
	date: Date,
	weekday: number,
	weekOfMonth: number | null
): boolean {
	if (getDay(date) !== weekday) return false
	if (weekOfMonth === null) return true
	return getWeekOfMonth(date) === weekOfMonth
}
