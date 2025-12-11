// utils/time.ts

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
