// lib/date.ts
export function formatMonthYear(date: Date): string {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
	})
}

export function formatHourShort(hour: number) {
	if (hour === 0) return '12a'
	if (hour < 12) return `${hour}a`
	if (hour === 12) return '12p'
	return `${hour - 12}p`
}
