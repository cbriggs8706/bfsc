// app/[locale]/admin/newsletter/page.tsx
import Link from 'next/link'
import { db, newsletterTranslations } from '@/db'
import { newsletterPosts } from '@/db'
import { Button } from '@/components/ui/button'
import { stripHtml } from '@/utils/strip-html'
import { desc, eq } from 'drizzle-orm'
import Image from 'next/image'

export default async function AdminNewsletterListPage() {
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
		.orderBy(desc(newsletterPosts.createdAt))

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-xl font-semibold">Newsletters</h1>
				<Button asChild>
					<Link href="./newsletter/create">New Newsletter</Link>
				</Button>
			</div>

			<div className="border rounded-md divide-y">
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
							<Button
								asChild
								size="sm"
								variant="outline"
								className="flex-1 md:flex-none"
							>
								<Link href={`./newsletter/update/${post.id}`}>Edit</Link>
							</Button>
							<Button
								asChild
								size="sm"
								variant="destructive"
								className="flex-1 md:flex-none"
							>
								<Link href={`./newsletter/delete/${post.id}`}>Delete</Link>
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
