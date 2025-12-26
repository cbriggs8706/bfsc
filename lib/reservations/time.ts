// lib/reservations/time.ts
export function toMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number)
	return h * 60 + m
}

export function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
