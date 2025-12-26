'use server'

import { db } from '@/db'
import { appSettings } from '@/db'
import { TimeFormat } from '@/types/shifts'
import { eq } from 'drizzle-orm'

export type AppSettings = {
	id: string

	// Time & display
	timeFormat: TimeFormat
	use24HourClock: boolean

	// Metadata
	updatedAt: Date
}

export async function getAppSettings(): Promise<AppSettings> {
	const [existing] = await db.select().from(appSettings).limit(1)

	if (existing) {
		return {
			...existing,
			timeFormat: existing.timeFormat as TimeFormat,
		}
	}

	// 🔧 Auto-create default settings
	const [created] = await db
		.insert(appSettings)
		.values({
			timeFormat: 'h:mm a',
			use24HourClock: false,
		})
		.returning()

	return {
		...created,
		timeFormat: created.timeFormat as TimeFormat,
	}
}

export async function updateTimeFormat(timeFormat: TimeFormat) {
	await db
		.update(appSettings)
		.set({
			timeFormat,
			updatedAt: new Date(),
		})
		.where(eq(appSettings.id, appSettings.id)) // single-row table
}
