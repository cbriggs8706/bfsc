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
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Create a Newsletter</h1>
				{/* <p className="text-sm text-muted-foreground"></p> */}
			</div>
			<NewsletterForm
				mode="create"
				value={EMPTY_NEWSLETTER_FORM}
				locale={locale}
				action={saveNewsletter}
			/>
		</div>
	)
}
