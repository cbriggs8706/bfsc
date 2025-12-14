// app/[locale]/(public)/consultant-helps/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { consultantHelps } from '@/lib/consultant-helps-data'
import Link from 'next/link'

export default function ConsultantHelpsPage() {
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Consultant Helps</h1>
				<p className="text-sm text-muted-foreground">
					Training resources and reference materials for Temple and Family
					History consultants
				</p>
			</div>

			{consultantHelps.map((section) => (
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
