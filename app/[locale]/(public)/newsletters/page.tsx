// app/[locale]/(public)/newsletters/page.tsx
import { NewsletterCard } from '@/components/newsletters/NewsletterCard'
import { NewsletterFilters } from '@/components/newsletters/NewsletterFilters'
import { getPublicNewsletters } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'

type Props = {
	params: Promise<{ locale: NewsletterLocale }>
	searchParams?: Promise<{
		q?: string
		tag?: string
		year?: string
		month?: string
	}>
}

export default async function NewsletterListPage({
	params,
	searchParams,
}: Props) {
	const { locale } = await params
	const sp = (await searchParams) ?? {}

	const qRaw = sp.q?.trim() ?? ''
	const q = qRaw.toLowerCase()
	const year = sp.year?.trim() ?? ''
	const month = sp.month?.trim() ?? ''

	// Fetch all published newsletters (already filtered by status)
	let posts = await getPublicNewsletters(locale)
	const years = Array.from(
		new Set(
			posts
				.map((p) => p.publishedAt?.getFullYear())
				.filter((v): v is number => typeof v === 'number')
		)
	).sort((a, b) => b - a)
	const months = Array.from({ length: 12 }, (_, i) => {
		const value = String(i + 1)
		const label = new Date(2000, i, 1).toLocaleDateString(undefined, {
			month: 'long',
		})
		return { value, label }
	})

	// ----------------------------
	// Filters (search + year + month)
	// ----------------------------
	posts = posts.filter((p) => {
		if (q) {
			const matchedText =
				p.title.toLowerCase().includes(q) ||
				(p.excerpt ?? '').toLowerCase().includes(q)
			if (!matchedText) return false
		}

		if (year) {
			const y = Number(year)
			if (!p.publishedAt || p.publishedAt.getFullYear() !== y) return false
		}

		if (month) {
			const m = Number(month)
			if (!p.publishedAt || p.publishedAt.getMonth() + 1 !== m) return false
		}

		return true
	})

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Newsletters</h1>
				<p className="text-sm text-muted-foreground">
					Monthly announcements and thought.
				</p>
			</div>
			{/* ----------------------------
			    Search
			----------------------------- */}
			<NewsletterFilters
				key={`${qRaw}|${year}|${month}`}
				q={qRaw}
				year={year}
				month={month}
				years={years}
				months={months}
				locale={locale}
			/>

			{/* ----------------------------
			    Archive (chronological)
			----------------------------- */}
			<section>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
					{posts.map((post) => (
						<NewsletterCard key={post.id} {...post} locale={locale} />
					))}
				</div>
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
