// app/[locale]/admin/announcements/create/page.tsx
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'
import { insertAnnouncement } from '@/db/queries/announcements'
import { requireRole } from '@/utils/require-role'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function NewAnnouncementPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/announcements`
	)

	async function createAction(input: Parameters<typeof insertAnnouncement>[0]) {
		'use server'
		await insertAnnouncement(input)
		revalidatePath('/admin/announcements')
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">
					{t('create')} {t('center.announcement')}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t('center.announcementCreateSub')}
				</p>
			</div>
			<AnnouncementForm
				mode="create"
				onSubmit={createAction}
				onDoneHref={`/${locale}/admin/announcements`}
			/>
		</div>
	)
}
