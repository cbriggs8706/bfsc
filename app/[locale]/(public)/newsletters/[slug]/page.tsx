// app/[locale]/(public)/newsletters/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { getPublicNewsletterBySlug } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'
import Image from 'next/image'

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
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{post.title}</h1>
				{post.publishedAt && (
					<p className="text-sm text-muted-foreground">
						{post.publishedAt.toLocaleDateString()}
					</p>
				)}{' '}
			</div>

			{post.coverImageUrl && (
				<div className="relative w-full aspect-video overflow-hidden rounded-md">
					<Image
						src={post.coverImageUrl}
						alt={post.title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 640px"
						priority={false}
					/>
				</div>
			)}

			<div
				className="
    prose prose-neutral max-w-none

    prose-headings:font-semibold
    prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4
    prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
    prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
    prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3

    prose-p:my-5
    prose-p:leading-relaxed

    prose-blockquote:my-8
    prose-blockquote:pl-6
    prose-blockquote:border-l-4

    prose-ul:my-6
    prose-ol:my-6
    prose-li:my-1

    prose-code:before:content-none
    prose-code:after:content-none
  "
				dangerouslySetInnerHTML={{
					__html: post.content,
				}}
			/>
		</div>
	)
}
