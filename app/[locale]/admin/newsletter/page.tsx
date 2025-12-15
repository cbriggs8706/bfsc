// app/[locale]/admin/newsletter/page.tsx
import Link from 'next/link'
import { db } from '@/db'
import { newsletterPosts } from '@/db'
import { Button } from '@/components/ui/button'

export default async function AdminNewsletterListPage() {
	const posts = await db.query.newsletterPosts.findMany({
		orderBy: (p, { desc }) => [desc(p.createdAt)],
	})

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
					<div key={post.id} className="flex items-center justify-between p-4">
						<div>
							<div className="font-medium">{post.slug}</div>
							<div className="text-sm text-muted-foreground">
								{post.status}
								{post.featured && ' • Featured'}
							</div>
						</div>

						<div className="flex gap-2">
							<Button asChild size="sm" variant="outline">
								<Link href={`./newsletter/read/${post.id}`}>Read</Link>
							</Button>
							<Button asChild size="sm" variant="outline">
								<Link href={`./newsletter/update/${post.id}`}>Edit</Link>
							</Button>
							<Button asChild size="sm" variant="destructive">
								<Link href={`./newsletter/delete/${post.id}`}>Delete</Link>
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
