// db/queries/announcements.ts
import 'server-only'
import { db } from '@/db'
import { announcement } from '@/db/schema/tables/announcements'
import { desc, eq, sql } from 'drizzle-orm'
import { ROLES, type Role } from '@/types/announcements'

export type AnnouncementRow = typeof announcement.$inferSelect
export type AnnouncementInsert = typeof announcement.$inferInsert

export type UIAnnouncement = Omit<AnnouncementRow, 'roles'> & {
	roles: Role[]
}

export type AnnouncementCreateInput = {
	title: string
	body: string
	roles: Role[]
	imageUrl: string | null
	expiresAt: Date | null
}

export type AnnouncementUpdateInput = Partial<AnnouncementCreateInput>

function isRole(value: unknown): value is Role {
	return typeof value === 'string' && ROLES.includes(value as Role)
}

export function toUIAnnouncement(row: AnnouncementRow): UIAnnouncement {
	return {
		...row,
		roles: row.roles.filter(isRole),
	}
}

export async function listAnnouncements(): Promise<UIAnnouncement[]> {
	const rows = await db
		.select()
		.from(announcement)
		.orderBy(desc(announcement.createdAt))

	return rows.map(toUIAnnouncement)
}

export async function getAnnouncementById(
	id: string
): Promise<UIAnnouncement | null> {
	const rows = await db
		.select()
		.from(announcement)
		.where(eq(announcement.id, id))
	return rows[0] ? toUIAnnouncement(rows[0]) : null
}

export async function insertAnnouncement(
	input: AnnouncementCreateInput
): Promise<void> {
	await db.insert(announcement).values({
		...input,
		createdAt: new Date(),
	})
}

export async function updateAnnouncement(
	id: string,
	input: AnnouncementUpdateInput
): Promise<void> {
	const patch: Partial<AnnouncementInsert> = {}

	if (input.title !== undefined) patch.title = input.title
	if (input.body !== undefined) patch.body = input.body
	if (input.roles !== undefined) patch.roles = input.roles
	if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl
	if (input.expiresAt !== undefined) patch.expiresAt = input.expiresAt

	await db.update(announcement).set(patch).where(eq(announcement.id, id))
}

export async function deleteAnnouncement(id: string): Promise<void> {
	await db.delete(announcement).where(eq(announcement.id, id))
}
