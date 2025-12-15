//components/newsletters/NewsletterCard.tsx
import { stripHtml } from '@/utils/strip-html'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
	slug: string
	locale: string
	title: string
	excerpt: string | null
	content: string | null
	publishedAt: Date | null
	coverImageUrl?: string | null
}

export function NewsletterCard({
	slug,
	title,
	content,
	excerpt,
	publishedAt,
	coverImageUrl,
	locale,
}: Props) {
	return (
		<Link
			href={`/${locale}/newsletter/${slug}`}
			className="block border rounded-lg p-4 hover:bg-muted space-y-2 bg-white"
		>
			{coverImageUrl && (
				<div className="relative w-full aspect-video overflow-hidden rounded-md">
					<Image
						src={coverImageUrl}
						alt={title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 640px"
						priority={false}
					/>
				</div>
			)}

			{publishedAt && (
				<div className="text-sm text-muted-foreground">
					{publishedAt.toLocaleDateString()}
				</div>
			)}

			<div className="text-lg font-semibold">{title}</div>

			{/* {content && (
				<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
					{stripHtml(content)}
				</p>
			)} */}
			{excerpt && (
				<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
					{excerpt}
				</p>
			)}
		</Link>
	)
}
