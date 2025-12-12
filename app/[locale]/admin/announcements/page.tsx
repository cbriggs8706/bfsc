// app/[locale]/admin/announcements/page.tsx
import { AnnouncementAdminTable } from '@/components/admin/announcements/AnnouncementAdminTable'
import { listAnnouncements } from '@/db/queries/announcements'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function AnnouncementAdminPage({ params }: Props) {
	const { locale } = await params
	const announcements = await listAnnouncements()

	return (
		<div className="space-y-8 p-4">
			<h1 className="text-2xl font-bold">Announcements</h1>
			<AnnouncementAdminTable announcements={announcements} locale={locale} />
		</div>
	)
}
