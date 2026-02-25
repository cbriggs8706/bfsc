// utils/time.ts

import { CenterTimeConfig } from '@/lib/time/center-time'
import { TimeFormat } from '@/types/shifts'
import { format, parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

//toAmPm works but should be replaced
export function toAmPm(time: string | null, locale?: string): string {
	if (!time) return ''
	// time expected as "HH:MM"
	const [h, m] = time.split(':').map(Number)
	const date = new Date()
	date.setHours(h, m, 0, 0)

	return date.toLocaleTimeString(locale, {
		hour: 'numeric',
		minute: '2-digit',
	})
}

export function formatLongDate(dateStr: string, locale?: string): string {
	return formatYmdLong(dateStr, locale)
}

// use for showing times to humans, rendering admin lists, emails, read-only summaries
// is only safe if you know the server TZ == center TZ (rare), do not use in reports, emails, availability UI, anything user-visible longterm
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
	const base = new Date(2000, 0, 1, 12, 0, 0) // noon anchor
	const startDate = parse(start, 'HH:mm', base)
	const endDate = parse(end, 'HH:mm', base)

	return `${format(startDate, formatString)} – ${format(endDate, formatString)}`
}

export function toLocalDateTimeInputValue(date = new Date()) {
	const pad = (n: number) => String(n).padStart(2, '0')

	return (
		`${date.getFullYear()}-` +
		`${pad(date.getMonth() + 1)}-` +
		`${pad(date.getDate())}T` +
		`${pad(date.getHours())}:` +
		`${pad(date.getMinutes())}`
	)
}

//
// ONLY USE THESE FROM NOW ON!!
//

// ✔ Keep getAppSettings()
// ✔ Add getCenterTimeConfig() as a thin wrapper

// ✔ Use only getCenterTimeConfig() in:
// availability
// reservations
// reports
// emails
// formatting utilities

// ✔ Use getAppSettings() only in:
// admin UI
// settings editor
// migrations
// diagnostics

export function formatTimeShort(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		hour12: true,
	}).formatToParts(date)

	const hour = parts.find((p) => p.type === 'hour')?.value
	const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value

	if (!hour || !dayPeriod) return ''

	return `${hour}${dayPeriod[0].toLowerCase()}`
}

export function formatYmdShort(ymd: string, locale?: string) {
	const [y, m, d] = ymd.split('-').map(Number)
	return new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	}).format(new Date(y, m - 1, d))
}

export function formatYmdLong(ymd: string, locale?: string) {
	const [y, m, d] = ymd.split('-').map(Number)
	return new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(y, m - 1, d))
}

export function formatYmdMonth(ym: string, locale?: string) {
	const [y, m] = ym.split('-').map(Number)
	return new Date(y, m - 1, 1).toLocaleString(locale, {
		month: 'long',
		year: 'numeric',
	})
}

export function weekdayFromYmd(ymd: string): number {
	const [y, m, d] = ymd.split('-').map(Number)
	return new Date(y, m - 1, d).getDay()
}

export function formatInCenterTime(dateUtc: Date, center: CenterTimeConfig) {
	return formatInTz(dateUtc, center.timeZone, center.timeFormat)
}

export function formatCenterDate(dateUtc: Date, center: CenterTimeConfig) {
	return formatInTz(dateUtc, center.timeZone, center.dateFormat)
}

//for use in displaying reports
export function ymdInTz(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date)
}

export function formatInTz(
	date: Date,
	timeZone: string,
	formatStr: string
): string {
	// date-fns formats local time, so we must shift first
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false,
	}).formatToParts(date)

	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)

	const zoned = new Date(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour'),
		get('minute'),
		get('second')
	)

	return format(zoned, formatStr)
}

// --------------------------- //
// MUST REMAIN AGNOSTIC IN UTC //
// --------------------------- //

export function toMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number)
	return h * 60 + m
}

export function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function addMinutes(d: Date, minutes: number) {
	return new Date(d.getTime() + minutes * 60_000)
}

// use for generating slot keys, matching availability, hyrdrating forms, doign server-side logic
export function toHHMMUtc(d: Date) {
	const hh = String(d.getUTCHours()).padStart(2, '0')
	const mm = String(d.getUTCMinutes()).padStart(2, '0')
	return `${hh}:${mm}`
}

//TO fix mixread of UTC in getAvailability and reservation.ts
export function toUtcDateTime(date: string, time: string) {
	// date: YYYY-MM-DD, time: HH:mm
	const [y, m, d] = date.split('-').map(Number)
	const [hh, mm] = time.split(':').map(Number)

	return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0))
}

export function toUtcDateTimeInTz(date: string, time: string, timeZone: string) {
	// Interprets date/time as wall-clock in timeZone, then returns UTC Date.
	const [y, m, d] = date.split('-').map(Number)
	const [hh, mm] = time.split(':').map(Number)
	const local = new Date(y, m - 1, d, hh, mm, 0, 0)
	return fromZonedTime(local, timeZone)
}

export function toHHMMInTz(d: Date, timeZone: string) {
	return formatInTz(d, timeZone, 'HH:mm')
}

export function weekdayFromYYYYMMDD(date: string) {
	return parseLocalYMD(date).getDay()
}

// ------------          --------------- //
// AVAILABILITY & FORM HYDRATION HELPERS //
// -------------          -------------- //

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

export function toYYYYMMDD(d: Date) {
	return toLocalYMD(d)
}
