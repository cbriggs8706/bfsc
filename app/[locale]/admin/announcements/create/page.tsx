import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'
import { insertAnnouncement } from '@/db/queries/announcements'
import { revalidatePath } from 'next/cache'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function NewAnnouncementPage({ params }: Props) {
	const { locale } = await params

	async function createAction(input: Parameters<typeof insertAnnouncement>[0]) {
		'use server'
		await insertAnnouncement(input)
		revalidatePath('/admin/announcements')
	}

	return (
		<div className="p-4">
			<AnnouncementForm
				mode="create"
				onSubmit={createAction}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
