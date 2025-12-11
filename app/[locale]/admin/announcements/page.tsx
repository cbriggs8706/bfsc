import { AnnouncementAdminTable } from '@/components/admin/announcement-admin-table'
import { db } from '@/db'
import { announcement } from '@/db/schema/tables/announcements'
import { Role } from '@/types/announcements'
import { desc } from 'drizzle-orm'

export default async function AnnouncementAdminPage() {
	const announcements = (
		await db.select().from(announcement).orderBy(desc(announcement.createdAt))
	).map((a) => ({
		...a,
		roles: a.roles as Role[],
	}))

	return (
		<div className="space-y-8 p-4">
			<h1 className="text-2xl font-bold">Announcements</h1>
			<AnnouncementAdminTable announcements={announcements} />
		</div>
	)
}
