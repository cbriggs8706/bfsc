// utils/time.ts

import { TimeFormat } from '@/types/shifts'
import { format, parse } from 'date-fns'

export function toAmPm(time: string | null): string {
	if (!time) return ''
	// time expected as "HH:MM"
	const [h, m] = time.split(':').map(Number)
	const date = new Date()
	date.setHours(h, m, 0, 0)

	return date.toLocaleTimeString([], {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	})
}

export function toMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number)
	return h * 60 + m
}

export function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function formatLongDate(dateStr: string): string {
	const date = parseLocalYMD(dateStr)

	const weekday = date.toLocaleString('en-US', { weekday: 'long' })
	const month = date.toLocaleString('en-US', { month: 'long' })
	const day = date.getDate()
	const year = date.getFullYear()

	const suffix =
		day % 10 === 1 && day !== 11
			? 'st'
			: day % 10 === 2 && day !== 12
			? 'nd'
			: day % 10 === 3 && day !== 13
			? 'rd'
			: 'th'

	return `${weekday}, ${month} ${day}${suffix}, ${year}`
}

export function toLocalYMD(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

export function parseLocalYMD(dateStr: string): Date {
	const [year, month, day] = dateStr.split('-').map(Number)
	return new Date(year, month - 1, day, 12, 0, 0)
	// ↑ 12:00 noon prevents DST/UTC edge cases
}

export function addMinutes(d: Date, minutes: number) {
	return new Date(d.getTime() + minutes * 60_000)
}

export function toHHMM(d: Date) {
	const hh = String(d.getHours()).padStart(2, '0')
	const mm = String(d.getMinutes()).padStart(2, '0')
	return `${hh}:${mm}`
}

export function toLocalDateTime(date: string, hhmm: string) {
	const [year, month, day] = date.split('-').map(Number)
	const [hour, minute] = hhmm.split(':').map(Number)

	// Local wall-clock time, no UTC parsing
	return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export function weekdayFromYYYYMMDD(date: string) {
	return parseLocalYMD(date).getDay()
}

export function toYYYYMMDD(d: Date) {
	return toLocalYMD(d)
}

type Args = {
	date: Date
	formatString: TimeFormat
	locale?: string // optional later
}

export function formatTime({ date, formatString }: Args) {
	return format(date, formatString)
}

export function formatTimeRange(
	start: string, // "16:00"
	end: string, // "18:00"
	formatString: TimeFormat
) {
	const startDate = parse(start, 'HH:mm', new Date())
	const endDate = parse(end, 'HH:mm', new Date())

	return `${format(startDate, formatString)} – ${format(endDate, formatString)}`
}
