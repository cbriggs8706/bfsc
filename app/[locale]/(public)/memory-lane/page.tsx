// app/[locale]/(public)/memory-lane/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MEMORY_LANE_SECTIONS } from '@/lib/memory-lane.data'
import Link from 'next/link'

function Checklist({ items }: { items: { label: string; href?: string }[] }) {
	return (
		<ul className="space-y-2">
			{items.map((it, i) => (
				<li key={i} className="flex items-start gap-3 text-sm">
					<span className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 bg-background" />
					{it.href ? (
						<Link
							href={it.href}
							target="_blank"
							className="text-primary hover:underline"
						>
							{it.label}
						</Link>
					) : (
						<span>{it.label}</span>
					)}
				</li>
			))}
		</ul>
	)
}

export default function MemoryLanePage() {
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Memory Lane</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Digitizing options available at the Burley FamilySearch Center to
					preserve photos, film, audio, and video.
				</p>
			</div>

			{MEMORY_LANE_SECTIONS.map((section) => (
				<Card key={section.title}>
					<CardHeader>
						<CardTitle>{section.title}</CardTitle>
					</CardHeader>
					<CardContent>{/* <Checklist items={section.items} /> */}</CardContent>
				</Card>
			))}
		</div>
	)
}
