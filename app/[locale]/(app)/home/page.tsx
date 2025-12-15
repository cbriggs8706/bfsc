// app/[locale]/(app)/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPublicNewsletters } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type Props = {
	params: Promise<{ locale: NewsletterLocale }>
}

export default async function HomePage({ params }: Props) {
	const { locale } = await params

	const posts = await getPublicNewsletters(locale)

	const [latest, ...rest] = posts

	return (
		<div className="space-y-20">
			{/* =============================
			   HERO — Latest Newsletter
			============================= */}
			{latest && (
				<section className="relative">
					<div className="relative w-full h-[60vh] overflow-hidden rounded-xl">
						{latest.coverImageUrl && (
							<Image
								src={latest.coverImageUrl}
								alt={latest.title}
								fill
								className="object-cover"
								priority
							/>
						)}
						<div className="absolute inset-0 bg-black/50" />
					</div>

					<div className="absolute inset-0 flex items-end">
						<div className="max-w-3xl p-6 md:p-10 text-white space-y-4">
							<div className="text-sm opacity-90">Latest Newsletter</div>

							<h1 className="text-3xl md:text-5xl font-bold leading-tight">
								{latest.title}
							</h1>

							{latest.excerpt && (
								<p className="text-lg text-white/90">{latest.excerpt}</p>
							)}

							<Button asChild size="lg">
								<Link href={`/${locale}/newsletter/${latest.slug}`}>
									Read Now
								</Link>
							</Button>
						</div>
					</div>
				</section>
			)}

			{/* =============================
			   RECENT NEWSLETTERS
			============================= */}
			<section className="max-w-6xl mx-auto px-4 space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-semibold">Recent Newsletters</h2>
					<Button variant="outline" asChild>
						<Link href={`/${locale}/newsletter`}>View All</Link>
					</Button>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{rest.slice(0, 6).map((post) => (
						<Card key={post.id} className="overflow-hidden">
							{post.coverImageUrl && (
								<div className="relative aspect-video">
									<Image
										src={post.coverImageUrl}
										alt={post.title}
										fill
										className="object-cover"
									/>
								</div>
							)}

							<CardContent className="p-4 space-y-2">
								<div className="text-xs text-muted-foreground">
									{post.publishedAt?.toLocaleDateString()}
								</div>

								<h3 className="font-semibold leading-tight line-clamp-2">
									{post.title}
								</h3>

								{post.excerpt && (
									<p className="text-sm text-muted-foreground line-clamp-3">
										{post.excerpt}
									</p>
								)}

								<Button asChild variant="link" className="px-0">
									<Link href={`/${locale}/newsletter/${post.slug}`}>
										Read →
									</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Separator />

			{/* =============================
			   PLACEHOLDER SECTION #1
			============================= */}
			<section className="max-w-5xl mx-auto px-4 space-y-4">
				<h2 className="text-2xl font-semibold">About This Organization</h2>
				<p className="text-muted-foreground max-w-3xl">
					This section can be used for a mission statement, welcome message, or
					explanation of what this site offers. Replace this copy later.
				</p>
			</section>

			{/* =============================
			   PLACEHOLDER SECTION #2
			============================= */}
			<section className="bg-muted/40 py-16">
				<div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-3">
					<Card>
						<CardContent className="p-6 space-y-2">
							<h3 className="font-semibold">Programs</h3>
							<p className="text-sm text-muted-foreground">
								Highlight key programs or services here.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 space-y-2">
							<h3 className="font-semibold">Get Involved</h3>
							<p className="text-sm text-muted-foreground">
								Volunteer, attend events, or contribute.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 space-y-2">
							<h3 className="font-semibold">Resources</h3>
							<p className="text-sm text-muted-foreground">
								Links, tools, or learning materials.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* =============================
			   PLACEHOLDER CTA
			============================= */}
			<section className="text-center space-y-4 px-4 pb-20">
				<h2 className="text-2xl font-semibold">Stay Connected</h2>
				<p className="text-muted-foreground">
					Subscribe, follow, or visit regularly for updates.
				</p>
				<Button size="lg" variant="default">
					Subscribe
				</Button>
			</section>
		</div>
	)
}
