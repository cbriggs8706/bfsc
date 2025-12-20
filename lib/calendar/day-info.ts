import { format, isAfter, isBefore, parse } from 'date-fns'

/* ============================
   TYPES (shared)
============================ */

export type Special = {
	date: string // yyyy-mm-dd
	isClosed: boolean
	opensAt: string | null
	closesAt: string | null
	reason?: string | null
}

export type Weekly = {
	weekday: number // 0–6
	opensAt: string
	closesAt: string
	isClosed: boolean
}

type StatusResult = {
	isOpen: boolean
	primary: string
	secondary: string
}

/* ============================
   HELPERS
============================ */

export function ymd(date: Date) {
	return format(date, 'yyyy-MM-dd')
}

export function getDayInfo(date: Date, specials: Special[], weekly: Weekly[]) {
	const key = ymd(date)
	const special = specials.find((s) => s.date === key)

	if (special) {
		return {
			isClosed: special.isClosed,
			opensAt: special.opensAt,
			closesAt: special.closesAt,
			reason: special.reason,
			source: 'special' as const,
		}
	}

	const weekday = date.getDay()
	const w = weekly.find((w) => w.weekday === weekday)

	if (!w) {
		return {
			isClosed: true,
			opensAt: null,
			closesAt: null,
			reason: null,
			source: 'missing' as const,
		}
	}

	return {
		isClosed: w.isClosed,
		opensAt: w.opensAt,
		closesAt: w.closesAt,
		reason: null,
		source: 'weekly' as const,
	}
}

/* ============================
   STATUS LINE CALCULATION
============================ */

export function getStatusLine(
	now: Date,
	specials: Special[],
	weekly: Weekly[]
): string {
	const info = getDayInfo(now, specials, weekly)

	if (info.isClosed) {
		// find next open day
		for (let i = 1; i <= 30; i++) {
			const d = new Date(now)
			d.setDate(d.getDate() + i)
			const next = getDayInfo(d, specials, weekly)

			if (!next.isClosed && next.opensAt) {
				return `Opens ${format(d, 'EEE')} ${formatTime(next.opensAt)}`
			}
		}
		return 'Closed'
	}

	// open today
	if (info.closesAt) {
		return `Open till ${formatTime(info.closesAt)}`
	}

	return 'Open'
}

function formatTime(time: string) {
	// time = "HH:mm"
	const d = parse(time, 'HH:mm', new Date())
	return format(d, 'h:mm a').toLowerCase()
}

export function getCenterStatus(
	now: Date,
	specials: Special[],
	weekly: Weekly[]
): StatusResult {
	const todayInfo = getDayInfo(now, specials, weekly)

	// ─────────────────────────────
	// OPEN NOW
	// ─────────────────────────────
	if (!todayInfo.isClosed && todayInfo.closesAt) {
		return {
			isOpen: true,
			primary: 'BFSC is currently Open',
			secondary: `Open till ${formatTime(todayInfo.closesAt)}`,
		}
	}

	// ─────────────────────────────
	// CLOSED → find next open day
	// ─────────────────────────────
	for (let i = 1; i <= 30; i++) {
		const d = new Date(now)
		d.setDate(d.getDate() + i)

		const info = getDayInfo(d, specials, weekly)

		if (!info.isClosed && info.opensAt) {
			return {
				isOpen: false,
				primary: 'BFSC is currently Closed',
				secondary: `Opens ${format(d, 'EEE, MMM d')} at ${formatTime(
					info.opensAt
				)}`,
			}
		}
	}

	// Fallback (extended closure)
	return {
		isOpen: false,
		primary: 'BFSC is currently Closed',
		secondary: 'No upcoming hours scheduled',
	}
}
