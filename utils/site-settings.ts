// utils/site-settings.ts
import 'server-only'
import { db } from '@/db'
import { siteSetting } from '@/db'
import { eq } from 'drizzle-orm'

export async function getClassesRequireApproval(): Promise<boolean> {
	const row = await db
		.select()
		.from(siteSetting)
		.where(eq(siteSetting.key, 'classes.requireApproval'))

	// ✅ SAFE DEFAULT
	// If setting doesn't exist yet, approval is OFF
	if (!row[0]) return false

	const value = row[0].value
	return typeof value === 'boolean' ? value : false
}
