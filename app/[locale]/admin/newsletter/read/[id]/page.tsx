// app/[locale]/admin/newsletter/read/[id]/page.tsx
import { notFound } from 'next/navigation'
import { NewsletterForm } from '@/components/newsletters/NewsletterForm'
import { getNewsletterForForm } from '@/db/queries/newsletters'

export default async function ReadNewsletterPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const data = await getNewsletterForForm(id)
	if (!data) notFound()

	return <NewsletterForm mode="read" value={data} locale={locale} />
}
