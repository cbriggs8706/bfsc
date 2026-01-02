// lib/date-ranges.ts
import type { DateRangePreset } from '@/types/shift-report'
import {
	endOfDay,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
	subWeeks,
	subMonths,
	subYears,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export function resolveDateRange(preset: DateRangePreset, timeZone: string) {
	// Convert "now" into Boise time FIRST
	const nowUtc = new Date()
	const now = toZonedTime(nowUtc, timeZone)

	let start: Date
	let end: Date

	switch (preset) {
		case 'wtd':
			start = startOfWeek(now, { weekStartsOn: 0 }) // Sunday
			end = endOfDay(now)
			break

		case 'lastWeek': {
			const lastWeek = subWeeks(now, 1)
			start = startOfWeek(lastWeek, { weekStartsOn: 0 })
			end = endOfWeek(lastWeek, { weekStartsOn: 0 })
			break
		}

		case 'mtd':
			start = startOfMonth(now)
			end = endOfDay(now)
			break

		case 'lastMonth': {
			const lastMonth = subMonths(now, 1)
			start = startOfMonth(lastMonth)
			end = endOfMonth(lastMonth)
			break
		}

		case 'ytd':
			start = startOfYear(now)
			end = endOfDay(now)
			break

		case 'lastYear': {
			const lastYear = subYears(now, 1)
			start = startOfYear(lastYear)
			end = endOfYear(lastYear)
			break
		}

		default:
			throw new Error(`Unknown preset: ${preset}`)
	}

	// Convert BACK to UTC so DB comparisons are correct
	return {
		start: fromZonedTime(start, timeZone),
		end: fromZonedTime(end, timeZone),
	}
}
