// app/[locale]/(public)/community-projects/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COMMUNITY_PROJECTS } from '@/lib/community-projects.data'
import Link from 'next/link'

export default function CommunityProjectsPage() {
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Community Projects</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Ongoing community projects you can help with through the Burley
					FamilySearch Center.
				</p>
			</div>

			{COMMUNITY_PROJECTS.map((section) => (
				<Card key={section.title}>
					<CardHeader>
						<CardTitle>{section.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{section.items.map((item, idx) => (
								<li key={idx} className="flex items-start gap-3 text-sm">
									<span className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 bg-background" />
									<span>
										{item.text}{' '}
										{item.links.map((l, i) => (
											<Link
												key={i}
												href={l.href}
												target="_blank"
												className="underline text-primary ml-1"
											>
												{l.label}
											</Link>
										))}
									</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
