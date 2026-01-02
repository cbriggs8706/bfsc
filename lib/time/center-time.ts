// lib/time/center-time.ts

//TODO new pattern for time
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

import { getAppSettings } from '@/lib/actions/app-settings'
import { TimeFormat } from '@/types/shifts'

export type CenterTimeConfig = {
	timeZone: string
	timeFormat: TimeFormat
	dateFormat: string
	use24HourClock: boolean
}

/**
 * Canonical accessor for center-level time behavior.
 * Use this everywhere time interpretation or formatting matters.
 */
export async function getCenterTimeConfig(): Promise<CenterTimeConfig> {
	const settings = await getAppSettings()

	return {
		timeZone: settings.timeZone,
		timeFormat: settings.timeFormat,
		dateFormat: settings.dateFormat,
		use24HourClock: settings.use24HourClock,
	}
}
