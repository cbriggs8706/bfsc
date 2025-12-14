// app/[locale]/(public)/activities/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { activities } from '@/lib/activities-data'
import Link from 'next/link'

export default function ActivitiesPage() {
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Activities</h1>
				<p className="text-sm text-muted-foreground">
					Activity ideas that can be used for ward, youth, and family history
					planning
				</p>
			</div>

			{activities.map((section) => (
				<Card key={section.title}>
					<CardHeader>
						<CardTitle>{section.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{section.items.map((item, idx) => (
								<li key={idx} className="flex gap-3 items-start">
									<Checkbox disabled className="mt-1" />
									<span className="text-sm">
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
