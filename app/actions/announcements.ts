'use server'

import { db } from '@/db'
import { announcement } from '@/db/schema/tables/announcements'
import {
	AnnouncementPayload,
	AnnouncementUpdatePayload,
} from '@/types/announcements'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createAnnouncement(data: AnnouncementPayload) {
	await db.insert(announcement).values({
		title: data.title,
		body: data.body,
		roles: data.roles,
		imageUrl: data.imageUrl ?? null,
		expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
		createdAt: new Date(),
	})
	revalidatePath('/admin/announcements')
}

export async function updateAnnouncement(
	id: string,
	data: AnnouncementUpdatePayload
) {
	await db
		.update(announcement)
		.set({
			...(data.title !== undefined && { title: data.title }),
			...(data.body !== undefined && { body: data.body }),
			...(data.roles !== undefined && { roles: data.roles }),
			...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
			...(data.expiresAt !== undefined && {
				expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
			}),
		})
		.where(eq(announcement.id, id))

	revalidatePath('/admin/announcements')
}

export async function deleteAnnouncement(id: string) {
	await db.delete(announcement).where(eq(announcement.id, id))
	revalidatePath('/admin/announcements')
}
