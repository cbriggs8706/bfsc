// app/[locale]/admin/newsletter/update/[id]/page.tsx
import { notFound } from 'next/navigation'
import { NewsletterForm } from '@/components/newsletters/NewsletterForm'
import { getNewsletterForForm } from '@/db/queries/newsletters'
import { saveNewsletter } from '@/app/actions/newsletter'

export default async function UpdateNewsletterPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
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
				action={saveNewsletter}
			/>
		</div>
	)
}
