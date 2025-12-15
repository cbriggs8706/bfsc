// lib/date.ts
export function formatMonthYear(date: Date): string {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
	})
}
