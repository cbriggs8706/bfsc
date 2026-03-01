// app/[locale]/admin/newsletter/update/[id]/page.tsx
import { notFound } from 'next/navigation'
import { NewsletterForm } from '@/components/newsletters/NewsletterForm'
import { getNewsletterForForm } from '@/db/queries/newsletters'
import { publishNewsletter, saveDraftNewsletter } from '@/app/actions/newsletter'
import { requirePermission } from '@/lib/permissions/require-permission'
import { can } from '@/lib/permissions/can'

export default async function UpdateNewsletterPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const user = await requirePermission(
		locale,
		'newsletters.update',
		`/${locale}/admin/newsletter`
	)
	const allowPublish = await can(
		user.id,
		user.role ?? 'Patron',
		'newsletters.publish'
	)
	const data = await getNewsletterForForm(id)
	if (!data) notFound()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Update Newsletter</h1>
				{/* <p className="text-sm text-muted-foreground"></p> */}
			</div>
			<NewsletterForm
				mode="update"
				value={data}
				locale={locale}
				draftAction={saveDraftNewsletter}
				publishAction={publishNewsletter}
				allowPublish={allowPublish}
			/>
		</div>
	)
}
