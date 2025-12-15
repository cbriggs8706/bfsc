// app/[locale]/(app)/newsletter/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { getPublicNewsletterBySlug } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'

type Props = {
	params: Promise<{ locale: NewsletterLocale; slug: string }>
}

export async function generateMetadata({ params }: Props) {
	const { locale, slug } = await params
	const post = await getPublicNewsletterBySlug(slug, locale)

	if (!post) return {}

	return {
		title: post.title,
		description: post.title,
	}
}

export default async function NewsletterDetailPage({ params }: Props) {
	const { locale, slug } = await params
	const post = await getPublicNewsletterBySlug(slug, locale)

	if (!post) notFound()

	return (
		<article className="max-w-3xl mx-auto space-y-6">
			<h1 className="text-3xl font-bold">{post.title}</h1>

			{post.publishedAt && (
				<div className="text-sm text-muted-foreground">
					{post.publishedAt.toLocaleDateString()}
				</div>
			)}

			<div
				className="prose max-w-none"
				dangerouslySetInnerHTML={{
					__html: post.content,
				}}
			/>
		</article>
	)
}
