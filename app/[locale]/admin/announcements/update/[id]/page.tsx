// app/[locale]/admin/announcements/update/[id]/page.tsx
import { notFound } from 'next/navigation'
import {
	getAnnouncementById,
	updateAnnouncement,
} from '@/db/queries/announcements'
import { revalidatePath } from 'next/cache'
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function UpdateAnnouncementPage({ params }: Props) {
	const { locale, id } = await params
	const announcement = await getAnnouncementById(id)
	const t = await getTranslations({ locale, namespace: 'common' })

	if (!announcement) notFound()

	async function updateAction(input: Parameters<typeof updateAnnouncement>[1]) {
		'use server'
		await updateAnnouncement(id, input)
		revalidatePath('/admin/announcements')
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">
					{t('update')} {announcement.title}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('center.announcementUpdateSub')}
				</p>
			</div>
			<AnnouncementForm
				mode="update"
				initial={announcement}
				onSubmit={updateAction}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
