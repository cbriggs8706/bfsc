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

export default async function AdminNewsletterListPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
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
										<Link href={`/${locale}/admin/newsletter/update/${post.id}`}>
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
