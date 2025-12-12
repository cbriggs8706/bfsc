import { notFound } from 'next/navigation'
import {
	getAnnouncementById,
	updateAnnouncement,
} from '@/db/queries/announcements'
import { revalidatePath } from 'next/cache'
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function UpdateAnnouncementPage({ params }: Props) {
	const { locale, id } = await params
	const announcement = await getAnnouncementById(id)

	if (!announcement) notFound()

	async function updateAction(input: Parameters<typeof updateAnnouncement>[1]) {
		'use server'
		await updateAnnouncement(id, input)
		revalidatePath('/admin/announcements')
	}

	return (
		<div className="p-4">
			<AnnouncementForm
				mode="update"
				initial={announcement}
				onSubmit={updateAction}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
