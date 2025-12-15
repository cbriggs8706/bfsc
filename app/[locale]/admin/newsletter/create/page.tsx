// app/[locale]/admin/newsletter/create/page.tsx
import { saveNewsletter } from '@/app/actions/newsletter'
import { NewsletterForm } from '@/components/newsletters/NewsletterForm'
import { EMPTY_NEWSLETTER_FORM } from '@/types/newsletters'

export default async function CreateNewsletterPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params

	return (
		<NewsletterForm
			mode="create"
			value={EMPTY_NEWSLETTER_FORM}
			locale={locale}
			action={saveNewsletter}
		/>
	)
}
