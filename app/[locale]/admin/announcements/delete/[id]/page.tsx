// app/[locale]/classes/update/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import {
	deleteAnnouncement,
	getAnnouncementById,
} from '@/db/queries/announcements'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function DeleteAnnouncementPage({ params }: Props) {
	const { locale, id } = await params
	const announcement = await getAnnouncementById(id)

	if (!announcement) notFound()

	async function deleteAction() {
		'use server'
		await deleteAnnouncement(id)
		revalidatePath(`/${locale}/admin/announcements`)
		redirect(`/${locale}/admin/announcements`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Delete {announcement.title}</h1>
				<p className="text-sm text-muted-foreground">Lorem ipsum</p>
			</div>

			<AnnouncementForm
				mode="delete"
				initial={announcement}
				onDoneHref={`/${locale}/admin/announcements`}
			/>

			<form action={deleteAction} className="flex gap-2">
				<Button variant="destructive" type="submit">
					Confirm Delete
				</Button>

				<Button asChild variant="secondary">
					<Link href={`/${locale}/admin/announcements`}>Cancel</Link>
				</Button>
			</form>
		</div>
	)
}
