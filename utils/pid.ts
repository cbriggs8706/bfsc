export function normalizePid(raw: string): string | null {
	const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

	if (cleaned.length !== 7) return null

	return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
}
