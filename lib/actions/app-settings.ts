// lib/actions/app-settings.ts
'use server'

import { db } from '@/db'
import { appSettings } from '@/db'
import { TimeFormat } from '@/types/shifts'
import { eq } from 'drizzle-orm'

export type AppSettings = {
	id: string
	timeZone: string
	timeFormat: TimeFormat
	dateFormat: string
	use24HourClock: boolean
	assignedGenieGreenieMicroskillIds: number[]
	updatedAt: Date
}

export type UpdateAppSettingsInput = {
	timeZone: string
	timeFormat: TimeFormat
	dateFormat: string
}

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

export async function getAppSettings(): Promise<AppSettings> {
	const [existing] = await db.select().from(appSettings).limit(1)

	if (existing) {
		return {
			...existing,
			timeFormat: existing.timeFormat as TimeFormat,
			timeZone: existing.timeZone ?? 'America/Boise',
			dateFormat: existing.dateFormat ?? 'MMM d, yyyy',
		}
	}

	// 🔧 Auto-create default settings
	const [created] = await db
		.insert(appSettings)
		.values({
			timeZone: 'America/Boise',
			timeFormat: 'h:mm a',
			dateFormat: 'MMM d, yyyy',
			use24HourClock: false,
		})
		.returning()

	return {
		...created,
		timeFormat: created.timeFormat as TimeFormat,
	}
}

export async function updateAppSettings(input: UpdateAppSettingsInput) {
	await db
		.update(appSettings)
		.set({
			timeZone: input.timeZone,
			timeFormat: input.timeFormat,
			dateFormat: input.dateFormat,
			updatedAt: new Date(),
		})
		.where(eq(appSettings.id, appSettings.id)) // single-row table
}
