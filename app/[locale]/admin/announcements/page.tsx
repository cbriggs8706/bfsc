// app/[locale]/admin/announcements/page.tsx
import { AnnouncementAdminTable } from '@/components/admin/announcements/AnnouncementAdminTable'
import { Card, CardContent } from '@/components/ui/card'
import { listAnnouncements } from '@/db/queries/announcements'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function AnnouncementAdminPage({ params }: Props) {
	const { locale } = await params
	const announcements = await listAnnouncements()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Announcements</h1>
				<p className="text-sm text-muted-foreground">
					Make announcements to patrons, consultants, shift leads etc.
				</p>
			</div>
			<Card>
				<CardContent>
					<AnnouncementAdminTable
						announcements={announcements}
						locale={locale}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
