// app/[locale]/(public)/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPublicNewsletters } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
	BadgeQuestionMark,
	Calendar,
	Camera,
	GraduationCap,
	MapIcon,
	Newspaper,
	Pencil,
	Search,
	Users2,
	Facebook,
	Instagram,
} from 'lucide-react'
import { SubscribeNewsletterCTA } from '@/components/newsletters/SubscribeNewsletterCTA'
import { SidebarCalendar } from '@/components/nav/SidebarCalendar'
import { db, operatingHours, specialHours } from '@/db'
import { eq } from 'drizzle-orm'

type Props = {
	params: Promise<{ locale: NewsletterLocale }>
	searchParams?: Promise<{ subscribed?: string }>
}

export default async function HomePage({ params, searchParams }: Props) {
	const { locale } = await params
	const sp = (await searchParams) ?? {}

	const subscribed = sp.subscribed === '1'
	const posts = await getPublicNewsletters(locale)

	const [latest, ...rest] = posts

	const weekly = await db.select().from(operatingHours)
	const specials = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))

	const homeCards = [
		{
			title: 'Calendar',
			url: `/${locale}/calendar`,
			icon: Calendar,
			description:
				'Plan a visit to attend a class or meet with a worker 1-on-1.',
		},
		{
			title: 'Group Visits',
			url: `/${locale}/groups`,
			icon: Users2,
			description: 'Plan and manage group visits to the center.',
		},
		{
			title: 'Research Specialists',
			url: `/${locale}/research-specialists`,
			icon: Search,
			description: 'Get help from trained research specialists.',
		},
		{
			title: 'Training Guide',
			url: `/${locale}/training-guide`,
			icon: GraduationCap,
			description: 'Learn how to use FamilySearch tools effectively.',
		},
		{
			title: 'Consultant Helps',
			url: `/${locale}/consultant-helps`,
			icon: BadgeQuestionMark,
			description: 'Resources and guides for consultants.',
		},
		{
			title: 'Community Projects',
			url: `/${locale}/projects`,
			icon: MapIcon,
			description: 'Explore and contribute to local history projects.',
		},
		{
			title: 'Memory Lane',
			url: `/${locale}/memory-lane`,
			icon: Camera,
			description: 'Stories, photos, and shared memories.',
		},
		{
			title: 'Activities',
			url: `/${locale}/activities`,
			icon: Pencil,
			description: 'Games and activities for individuals and groups.',
		},
		{
			title: 'Newsletters',
			url: `/${locale}/newsletters`,
			icon: Newspaper,
			description: 'Read updates, highlights, and center news.',
		},
	]

	return (
		<div className="space-y-20">
			{subscribed && (
				<div className="max-w-4xl mx-auto px-4">
					<div className="rounded-lg border border-(--green-logo) bg-(--green-logo-soft) p-4 ">
						<div className="flex items-start gap-3">
							<span className="text-lg">✅</span>
							<p className="text-sm">
								<strong>You&apos;re subscribed to our newsletter!</strong> Stay
								tuned towards the end of the month. In the meantime, previous
								newsletters can be found below.
							</p>
						</div>
					</div>
				</div>
			)}

			<section className="max-w-6xl mx-auto px-4">
				<div className="flex flex-col gap-6 md:gap-8">
					{/* Building Image */}
					<div className="relative w-full aspect-video rounded-xl overflow-hidden">
						<Image
							src="/900px-Idahoburleyfhc.jpg"
							alt="Burley FamilySearch Center building"
							fill
							className="object-cover"
							priority
						/>
					</div>

					{/* Center Info */}
					<div className="space-y-4 md:space-y-5">
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center whitespace-nowrap">
							Burley FamilySearch Center
						</h1>

						<div className="space-y-2 text-lg md:text-xl text-muted-foreground text-center justify-center">
							<p>224 East 14th Street, Burley, ID</p>

							<Button
								asChild
								size="lg"
								className="text-2xl px-8 py-6"
								aria-label="Call the Burley FamilySearch Center"
							>
								<a href="tel:+12088787286">208-878-7286</a>
							</Button>
						</div>

						<div className="flex flex-col md:flex-row gap-2">
							<Card className="flex w-full md:w-1/2">
								<CardHeader className="font-semibold text-lg md:text-xl">
									Hours of Operation
								</CardHeader>
								<CardContent>
									<ul className="text-base lg:text-lg">
										<li>Sunday: 2pm – 6pm</li>
										<li>Monday: 12pm – 4pm</li>
										<li>Tuesday: 10am – 6pm</li>
										<li>Wednesday: 10am – 6pm</li>
										<li>Thursday: 10am – 8pm</li>
										<li>Friday: By Appointment</li>
										<li>Saturday: By Appointment</li>
									</ul>
									<div className="mt-2">
										<SidebarCalendar
											specials={specials}
											weekly={weekly}
											locale={locale as string}
										/>
									</div>
								</CardContent>
							</Card>
							<Card className="flex w-full md:w-1/2">
								<CardHeader className="font-semibold text-lg md:text-xl">
									Appointments
								</CardHeader>
								<CardContent className="space-y-2">
									<p className="text-base lg:text-lg">
										We can open the center for individuals or groups by
										appointment outside of our normal operating hours.
									</p>{' '}
									<p className="text-base lg:text-lg">
										Many youth groups schedule for Wednesday evenings from 6-8pm
										for guided activities and classes.
									</p>{' '}
									<div className="flex flex-col mt-10 text-center justify-center">
										{/* TODO replace with group reservations */}
										<Link href={`/${locale}/reservation`}>
											<Button variant="default" size="lg">
												Make a reservation
											</Button>
										</Link>
										<span className="text-xs">Requires login</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* =============================
			   ABOUT
			============================= */}
			<section className="max-w-5xl mx-auto px-4 space-y-4">
				<h2 className="text-2xl font-semibold">About This Center</h2>
				<p className="text-muted-foreground w-full">
					The Burley FamilySearch Center is dedicated to assisting people in
					researching their family and preserving their memories for future
					generations. Staff are available for one-on-one assistance. We offer
					classes for all ages and skills. Additionally, we have the capability
					of digitizing most media types. VHS and VHS-C tapes, mini DV, 8 mm
					cassette movies, audio cassettes, audio reels, 8 mm reel movies,
					slides, negatives, pictures, documents, newspaper clippings, etc. Come
					see what we can do for you!
				</p>
			</section>

			{/* =============================
			  SECTION #2
			============================= */}
			<section className="bg-muted/40 py-4">
				<div className="max-w-6xl mx-auto px-4 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
					{homeCards.map(({ title, url, icon: Icon, description }) => (
						<Link key={title} href={url} className="group">
							<Card className="h-full transition hover:shadow-md hover:border-primary">
								<CardContent className="p-6 space-y-3">
									<div className="flex items-center gap-3">
										<Icon className="h-6 w-6 text-primary" />
										<h3 className="font-semibold group-hover:underline">
											{title}
										</h3>
									</div>

									<p className="text-sm text-muted-foreground">{description}</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</section>

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
								<Link href={`/${locale}/newsletters/${latest.slug}`}>
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
					<Link href={`/${locale}/newsletters`}>
						<Button variant="default">View All</Button>
					</Link>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{rest.slice(0, 6).map((post) => (
						<Link key={post.id} href={`/${locale}/newsletter/${post.slug}`}>
							<Card className="overflow-hidden">
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

									<Button variant="link" className="px-0">
										Read →
									</Button>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</section>

			<Separator />

			{/* =============================
			   CTA
			============================= */}
			<section className="text-center space-y-6 px-4 pb-20">
				<h2 className="text-2xl font-semibold">Stay Connected</h2>

				<p className="text-muted-foreground">
					Subscribe, follow, or visit regularly for updates.
				</p>

				<div className="flex flex-col items-center gap-4">
					<SubscribeNewsletterCTA />

					<div className="flex items-center gap-4">
						<Link
							href="https://www.facebook.com/burleyfamilyhistory"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button
								variant="outline"
								size="icon"
								aria-label="Visit us on Facebook"
							>
								<Facebook className="h-5 w-5" />
							</Button>
						</Link>

						<Link
							href="https://www.instagram.com/burleyidahofhc/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button
								variant="outline"
								size="icon"
								aria-label="Visit us on Instagram"
							>
								<Instagram className="h-5 w-5" />
							</Button>
						</Link>
					</div>
				</div>
			</section>
		</div>
	)
}
