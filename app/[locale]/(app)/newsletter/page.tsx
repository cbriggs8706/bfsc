// app/[locale]/(app)/newsletter/page.tsx
import Link from 'next/link'
import { NewsletterCard } from '@/components/newsletters/NewsletterCard'
import { getPublicNewsletters } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'

type Props = {
	params: Promise<{ locale: NewsletterLocale }>
	searchParams?: Promise<{
		q?: string
		tag?: string
	}>
}

function formatMonthYear(date: Date): string {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
	})
}

export default async function NewsletterListPage({
	params,
	searchParams,
}: Props) {
	const { locale } = await params
	const sp = (await searchParams) ?? {}

	const q = sp.q?.toLowerCase()
	const tag = sp.tag

	// Fetch all published newsletters (already filtered by status)
	let posts = await getPublicNewsletters(locale)

	// ----------------------------
	// Search (title + excerpt)
	// ----------------------------
	if (q) {
		posts = posts.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				(p.excerpt ?? '').toLowerCase().includes(q)
		)
	}

	// ----------------------------
	// Featured vs regular
	// ----------------------------
	const featured = posts.filter((p) => p.featured)
	const regular = posts.filter((p) => !p.featured)

	// ----------------------------
	// Month grouping (regular posts)
	// ----------------------------
	const grouped = regular.reduce<Record<string, typeof regular>>(
		(acc, post) => {
			if (!post.publishedAt) return acc
			const key = formatMonthYear(post.publishedAt)
			acc[key] = acc[key] || []
			acc[key].push(post)
			return acc
		},
		{}
	)

	return (
		<div className="max-w-3xl mx-auto space-y-10">
			<h1 className="text-3xl font-bold">Newsletter</h1>

			{/* ----------------------------
			    Search
			----------------------------- */}
			<form className="flex gap-2">
				<input
					type="text"
					name="q"
					defaultValue={q}
					placeholder="Search newsletters"
					className="flex-1 border rounded px-3 py-2"
				/>
				<button className="border rounded px-4 py-2">Search</button>
			</form>

			{/* ----------------------------
			    Featured
			----------------------------- */}
			{featured.length > 0 && (
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">Featured</h2>
					{featured.map((post) => (
						<NewsletterCard key={post.id} {...post} />
					))}
				</section>
			)}

			{/* ----------------------------
			    Monthly archive
			----------------------------- */}
			<section className="space-y-10">
				{Object.entries(grouped).map(([month, posts]) => (
					<div key={month} className="space-y-4">
						<h2 className="text-xl font-semibold">{month}</h2>
						{posts.map((post) => (
							<NewsletterCard key={post.id} {...post} />
						))}
					</div>
				))}
			</section>

			{/* ----------------------------
			    Empty state
			----------------------------- */}
			{posts.length === 0 && (
				<p className="text-muted-foreground">No newsletters found.</p>
			)}
		</div>
	)
}
