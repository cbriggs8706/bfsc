// app/[locale]/admin/newsletter/page.tsx
import Link from 'next/link'
import { db, newsletterTranslations } from '@/db'
import { newsletterPosts } from '@/db'
import { Button } from '@/components/ui/button'
import { stripHtml } from '@/utils/strip-html'
import { desc, eq, sql } from 'drizzle-orm'
import Image from 'next/image'
import { getNewsletterEmailList } from '@/db/queries/newsletters'
import { Label } from '@/components/ui/label'
import { CopyEmailList } from '@/components/newsletters/CopyEmailList'
import { requirePermission } from '@/lib/permissions/require-permission'
import { can } from '@/lib/permissions/can'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sendNewsletterBroadcastEmail } from '@/app/actions/newsletter-broadcast-email'
import { NewsletterBroadcastPanel } from '@/components/newsletters/NewsletterBroadcastPanel'
import { newsletterEmailSends } from '@/db/schema/tables/newsletters'

function firstValue(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value
}

export default async function AdminNewsletterListPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>
	searchParams: Promise<{
		mailStatus?: string | string[]
		mailCount?: string | string[]
		mailError?: string | string[]
		mailMode?: string | string[]
		mailRecipient?: string | string[]
	}>
}) {
	const { locale } = await params
	const query = await searchParams
	const viewer = await requirePermission(
		locale,
		'newsletters.view',
		`/${locale}/admin/newsletter`
	)
	const [canCreate, canUpdate, canDelete] = await Promise.all([
		can(viewer.id, viewer.role ?? 'Patron', 'newsletters.create'),
		can(viewer.id, viewer.role ?? 'Patron', 'newsletters.update'),
		can(viewer.id, viewer.role ?? 'Patron', 'newsletters.delete'),
	])
	const canBroadcast = canCreate || canUpdate

	const posts = await db
		.select({
			id: newsletterPosts.id,
			slug: newsletterPosts.slug,
			status: newsletterPosts.status,
			featured: newsletterPosts.featured,
			publishedAt: newsletterPosts.publishedAt,
			coverImageUrl: newsletterPosts.coverImageUrl,
			excerpt: newsletterTranslations.excerpt,
			content: newsletterTranslations.content,
			title: newsletterTranslations.title,
			createdAt: newsletterPosts.createdAt,
		})
		.from(newsletterPosts)
		.leftJoin(
			newsletterTranslations,
			eq(newsletterTranslations.postId, newsletterPosts.id)
		)
		.where(eq(newsletterTranslations.locale, 'en'))
		.orderBy(
			desc(
				sql`COALESCE(${newsletterPosts.publishedAt}, ${newsletterPosts.createdAt})`
			)
		)

	// const emailString = await getNewsletterEmailList()
	const emailString = (await getNewsletterEmailList()).join(', ')
	const mailStatus = firstValue(query.mailStatus)
	const mailCount = firstValue(query.mailCount)
	const mailError = firstValue(query.mailError)
	const mailMode = firstValue(query.mailMode)
	const mailRecipient = firstValue(query.mailRecipient)
	const returnTo = `/${locale}/admin/newsletter`
	const recentSends = await db
		.select({
			id: newsletterEmailSends.id,
			senderEmail: newsletterEmailSends.senderEmail,
			sendMode: newsletterEmailSends.sendMode,
			subject: newsletterEmailSends.subject,
			recipientCount: newsletterEmailSends.recipientCount,
			recipientEmailsSample: newsletterEmailSends.recipientEmailsSample,
			attachmentNames: newsletterEmailSends.attachmentNames,
			createdAt: newsletterEmailSends.createdAt,
		})
		.from(newsletterEmailSends)
		.orderBy(desc(newsletterEmailSends.createdAt))
		.limit(20)

	return (
		<div className="p-4 space-y-4">
			<div>
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">Newsletters</h1>

					{canCreate ? (
						<Button asChild>
							<Link href={`/${locale}/admin/newsletter/create`}>
								New Newsletter
							</Link>
						</Button>
					) : null}
				</div>
				<p className="text-sm text-muted-foreground">
					Create, edit or delete newsletters.
				</p>
			</div>

			{mailStatus === 'sent' && (
				<div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
					{mailMode === 'test'
						? `Test email sent to ${mailRecipient ?? 'your address'} (${mailCount ?? '0'} recipient).`
						: `Email sent to ${mailCount ?? '0'} recipient(s).`}
				</div>
			)}
			{mailStatus === 'error' && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
					{mailError ?? 'Email send failed.'}
				</div>
			)}

			{canBroadcast ? (
				<Card>
					<CardHeader>
						<CardTitle>Send Newsletter Email</CardTitle>
						<p className="text-sm text-muted-foreground">
							Send to all users and confirmed newsletter subscribers. Add this
							month&apos;s class schedule PDF and any extra attachments before
							sending.
						</p>
					</CardHeader>
					<CardContent>
						<NewsletterBroadcastPanel
							locale={locale}
							returnTo={returnTo}
							action={sendNewsletterBroadcastEmail}
						/>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Recent Send Log</CardTitle>
					<p className="text-sm text-muted-foreground">
						Server-side history of newsletter sends.
					</p>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left">
									<th className="py-2 pr-3">When</th>
									<th className="py-2 pr-3">Mode</th>
									<th className="py-2 pr-3">Sender</th>
									<th className="py-2 pr-3">Subject</th>
									<th className="py-2 pr-3">Recipients</th>
									<th className="py-2 pr-3">Recipient Emails (Sample)</th>
									<th className="py-2 pr-3">Attachments</th>
								</tr>
							</thead>
							<tbody>
								{recentSends.map((row) => {
									const recipientSample = Array.isArray(
										row.recipientEmailsSample
									)
										? row.recipientEmailsSample
												.filter((email): email is string => typeof email === 'string')
												.join(', ')
										: ''
									const names = Array.isArray(row.attachmentNames)
										? row.attachmentNames
												.filter((name): name is string => typeof name === 'string')
												.join(', ')
										: ''
									return (
										<tr key={row.id} className="border-b align-top">
											<td className="py-2 pr-3 whitespace-nowrap">
												{row.createdAt.toLocaleString()}
											</td>
											<td className="py-2 pr-3 whitespace-nowrap capitalize">
												{row.sendMode}
											</td>
											<td className="py-2 pr-3">{row.senderEmail}</td>
											<td className="py-2 pr-3">{row.subject}</td>
											<td className="py-2 pr-3">{row.recipientCount}</td>
											<td className="py-2 pr-3">
												{recipientSample.length > 0 ? recipientSample : '—'}
											</td>
											<td className="py-2 pr-3">
												{names.length > 0 ? names : '—'}
											</td>
										</tr>
									)
								})}

								{recentSends.length === 0 ? (
									<tr>
										<td colSpan={7} className="py-4 text-center text-muted-foreground">
											No send logs yet.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			<div className="border rounded-md divide-y bg-card">
				{posts.map((post) => (
					<div
						key={post.id}
						className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
					>
						{/* LEFT: thumbnail + content */}
						<div className="flex gap-3 min-w-0">
							{/* Thumbnail */}
							{post.coverImageUrl && (
								<div className="relative h-14 w-24 shrink-0 overflow-hidden rounded">
									<Image
										src={post.coverImageUrl}
										alt=""
										fill
										className="object-cover"
										sizes="96px"
									/>
								</div>
							)}

							{/* Text */}
							<div className="min-w-0">
								<div className="font-medium truncate">{post.title}</div>

								<div className="text-sm text-muted-foreground">
									{post.publishedAt
										? `Published on ${post.publishedAt.toLocaleDateString()} as ${
												post.slug
										  }`
										: `Draft ${post.slug}`}{' '}
									{post.featured && ' • Featured'}
								</div>

								{post.excerpt && (
									<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
										{stripHtml(post.excerpt)}
									</p>
								)}
							</div>
						</div>

							{/* ACTIONS */}
							<div className="flex gap-2 md:justify-end">
							{/* <Button
								asChild
								size="sm"
								variant="outline"
								className="flex-1 md:flex-none"
							>
								<Link href={`./newsletter/read/${post.id}`}>Read</Link>
							</Button> */}
								{canUpdate ? (
									<Button
										asChild
										size="sm"
										variant="outline"
										className="flex-1 md:flex-none"
									>
										<Link
											href={`/${locale}/admin/newsletter/update/${post.id}`}
											prefetch={false}
										>
											Edit
										</Link>
									</Button>
								) : null}
								{canDelete ? (
									<Button
										asChild
										size="sm"
										variant="destructive"
										className="flex-1 md:flex-none"
									>
										<Link href={`/${locale}/admin/newsletter/delete/${post.id}`}>
											Delete
										</Link>
									</Button>
								) : null}
							</div>
					</div>
				))}
			</div>
			<Label>Latest Email List</Label>

			<div className="flex justify-end">
				<CopyEmailList text={emailString} />
			</div>

			<textarea
				readOnly
				className="w-full min-h-[120px] rounded-md border p-3 font-mono text-sm"
				value={emailString}
			/>
		</div>
	)
}
