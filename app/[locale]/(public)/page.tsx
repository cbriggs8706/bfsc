// app/[locale]/(public)/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPublicNewsletters } from '@/db/queries/newsletters'
import { NewsletterLocale } from '@/types/newsletters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Camera, MapIcon, Newspaper, Search, Users2, Facebook, Instagram } from 'lucide-react'
import { SubscribeNewsletterCTA } from '@/components/newsletters/SubscribeNewsletterCTA'
import { SidebarCalendar } from '@/components/nav/SidebarCalendar'
import { db, operatingHours, specialHours } from '@/db'
import { eq } from 'drizzle-orm'
import { getCenterProfile } from '@/lib/actions/center/center'
import { formatPhoneInternational } from '@/utils/phone'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { getFaithTree } from '@/db/queries/faiths'
import type { Resource } from '@/types/resource'
import { ReservationDialog } from '@/components/resource/ReservationDialog'
import { getTranslations } from 'next-intl/server'

type Props = {
	params: Promise<{ locale: NewsletterLocale }>
	searchParams?: Promise<{ subscribed?: string }>
}

export default async function HomePage({ params, searchParams }: Props) {
	const { locale } = await params
	const sp = (await searchParams) ?? {}
	const t = await getTranslations({ locale, namespace: 'home' })

	const subscribed = sp.subscribed === '1'
	const posts = await getPublicNewsletters(locale)
	const session = await getServerSession(authOptions)

	const center = await getCenterProfile()
	const heroImageSrc = center.heroImageUrl || '/900px-Idahoburleyfhc.jpg'

	const [latest, ...rest] = posts
	const latestCoverImageUrl = latest?.coverImageUrl ?? null

	const { items: reservationItems } = await readAllResources({
		page: 1,
		pageSize: 200,
	})
	const centerTime = await getCenterTimeConfig()
	const faithTree = await getFaithTree()

	const weekly = await db.select().from(operatingHours)
	const specials = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))

	const homeCards = [
		{
			title: t('cards.calendar.title'),
			url: `/${locale}/calendar`,
			icon: Calendar,
			description: t('cards.calendar.description'),
		},
		{
			title: t('cards.groups.title'),
			url: `/${locale}/groups`,
			icon: Users2,
			description: t('cards.groups.description'),
		},
		{
			title: t('cards.research.title'),
			url: `/${locale}/research-specialists`,
			icon: Search,
			description: t('cards.research.description'),
		},

		{
			title: t('cards.projects.title'),
			url: `/${locale}/projects`,
			icon: MapIcon,
			description: t('cards.projects.description'),
		},
		{
			title: t('cards.memoryLane.title'),
			url: `/${locale}/memory-lane`,
			icon: Camera,
			description: t('cards.memoryLane.description'),
		},

		{
			title: t('cards.newsletters.title'),
			url: `/${locale}/newsletters`,
			icon: Newspaper,
			description: t('cards.newsletters.description'),
		},
	]

	const reservationResources = reservationItems.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))
	const canReserve = Boolean(session)
	const newsletterDateFormatter = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	return (
		<div className="space-y-20">
			{subscribed && (
				<div className="max-w-4xl mx-auto px-4">
					<div className="rounded-lg border border-(--green-logo) bg-(--green-logo-soft) p-4 ">
						<div className="flex items-start gap-3">
							<span className="text-lg">✅</span>
							<p className="text-sm">
								<strong>{t('subscribed.title')}</strong>{' '}
								{t('subscribed.body')}
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
							src={heroImageSrc}
							alt={t('hero.imageAlt')}
							fill
							className="object-cover"
							priority
						/>
					</div>

					{/* Center Info */}
					<div className="space-y-4 md:space-y-5">
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center whitespace-nowrap">
							{center.name}
						</h1>

						<div className="space-y-2 text-lg md:text-xl text-muted-foreground text-center justify-center">
							<p>
								{center.address}, {center.city}, {center.state}
							</p>

							<Button
								asChild
								size="lg"
								className="text-2xl px-8 py-6"
								aria-label={t('hero.callAriaLabel', { centerName: center.name })}
							>
								<a href={`tel:${center.phoneNumber}`}>
									{formatPhoneInternational(center.phoneNumber)}
								</a>
							</Button>
						</div>

						<div className="flex flex-col md:flex-row gap-2">
							<Card className="flex w-full md:w-1/2">
								<CardHeader className="font-semibold text-lg md:text-xl">
									{t('hours.title')}
								</CardHeader>
								<CardContent>
									<ul className="text-base lg:text-lg">
										<li>{t('hours.sunday')}</li>
										<li>{t('hours.monday')}</li>
										<li>{t('hours.tuesday')}</li>
										<li>{t('hours.wednesday')}</li>
										<li>{t('hours.thursday')}</li>
										<li>{t('hours.friday')}</li>
										<li>{t('hours.saturday')}</li>
									</ul>
									<div className="mt-2">
										<SidebarCalendar
											specials={specials}
											weekly={weekly}
											locale={locale as string}
											centerTimeZone={centerTime.timeZone}
										/>
									</div>
								</CardContent>
							</Card>
							<Card className="flex w-full md:w-1/2">
								<CardHeader className="font-semibold text-lg md:text-xl">
									{t('appointments.title')}
								</CardHeader>
								<CardContent className="space-y-2">
									<p className="text-base lg:text-lg">
										{t('appointments.bodyOne')}
									</p>
									<p className="text-base lg:text-lg">
										{t('appointments.bodyTwo')}
									</p>
									<div className="flex flex-col mt-10 text-center justify-center">
										{canReserve ? (
											<ReservationDialog
												locale={locale}
												data={{
													resources: reservationResources,
													faithTree,
													timeFormat: centerTime.timeFormat,
												}}
												buttonLabel={t('appointments.cta')}
											/>
										) : (
											<Link href={`/${locale}/login?redirect=/${locale}`}>
												<Button variant="default" size="lg">
													{t('appointments.cta')}
												</Button>
											</Link>
										)}
										<span className="text-xs">
											{t('appointments.requiresLogin')}
										</span>
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
				<h2 className="text-2xl font-semibold">{t('about.title')}</h2>
				<p className="text-muted-foreground w-full">
					{t('about.body')}
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
				<section className="overflow-hidden rounded-xl border bg-card">
					{latestCoverImageUrl && (
						<div className="relative h-[46vh] min-h-[280px] w-full">
							<Image
								src={latestCoverImageUrl}
								alt={latest.title}
								fill
								className="object-cover"
								priority
							/>
						</div>
					)}

					<div
						className={`space-y-4 p-6 md:p-10 ${latestCoverImageUrl ? 'max-w-3xl' : 'mx-auto max-w-4xl'}`}
					>
						<div className="text-sm text-muted-foreground">
							{t('latest.label')}
						</div>

						<h1 className="text-3xl md:text-5xl font-bold leading-tight">
							{latest.title}
						</h1>

						{latest.excerpt && (
							<p className="text-lg text-muted-foreground">{latest.excerpt}</p>
						)}

						<Button asChild size="lg">
							<Link href={`/${locale}/newsletters/${latest.slug}`}>
								{t('latest.cta')}
							</Link>
						</Button>
					</div>
				</section>
			)}

			{/* =============================
			   RECENT NEWSLETTERS
			============================= */}
			<section className="max-w-6xl mx-auto px-4 space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-semibold">{t('recent.title')}</h2>
					<Link href={`/${locale}/newsletters`}>
						<Button variant="default">{t('recent.viewAll')}</Button>
					</Link>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{rest.slice(0, 6).map((post) => (
						<Link key={post.id} href={`/${locale}/newsletters/${post.slug}`}>
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
										{post.publishedAt
											? newsletterDateFormatter.format(post.publishedAt)
											: ''}
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
										{t('recent.readMore')}
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
				<h2 className="text-2xl font-semibold">{t('connect.title')}</h2>

				<p className="text-muted-foreground">
					{t('connect.body')}
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
								aria-label={t('connect.facebookAriaLabel')}
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
								aria-label={t('connect.instagramAriaLabel')}
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
