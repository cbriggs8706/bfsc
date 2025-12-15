// app/[locale]/admin/newsletter/delete/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { NewsletterForm } from '@/components/newsletters/NewsletterForm'
import { getNewsletterForForm } from '@/db/queries/newsletters'
import { deleteNewsletter } from '@/app/actions/newsletter'
export default async function DeleteNewsletterPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const data = await getNewsletterForForm(id)
	if (!data) notFound()

	return (
		<NewsletterForm
			mode="delete"
			value={data}
			locale={locale}
			action={async () => {
				'use server'
				await deleteNewsletter(id, locale)
			}}
		/>
	)
}
