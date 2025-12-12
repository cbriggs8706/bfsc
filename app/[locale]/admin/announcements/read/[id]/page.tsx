import { notFound } from 'next/navigation'
import { getAnnouncementById } from '@/db/queries/announcements'
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function ReadAnnouncementPage({ params }: Props) {
	const { locale, id } = await params
	const announcement = await getAnnouncementById(id)

	if (!announcement) notFound()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{announcement.title}</h1>
				<p className="text-sm text-muted-foreground">
					To make edits, go back and click the edit button.
				</p>
			</div>
			<AnnouncementForm
				mode="read"
				initial={announcement}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
