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
		<div className="p-4">
			<AnnouncementForm
				mode="read"
				initial={announcement}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
