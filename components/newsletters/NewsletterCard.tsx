//components/newsletters/NewsletterCard.tsx
import Link from 'next/link'

type Props = {
	slug: string
	title: string
	excerpt: string | null
	publishedAt: Date | null
}

export function NewsletterCard({ slug, title, excerpt, publishedAt }: Props) {
	return (
		<Link
			href={`/newsletter/${slug}`}
			className="block border rounded-lg p-4 hover:bg-muted"
		>
			<div className="text-sm text-muted-foreground">
				{publishedAt?.toLocaleDateString()}
			</div>
			<div className="text-lg font-semibold">{title}</div>
			{excerpt && (
				<p className="text-sm text-muted-foreground mt-1">{excerpt}</p>
			)}
		</Link>
	)
}
