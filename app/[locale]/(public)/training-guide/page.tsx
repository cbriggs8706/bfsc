// app/[locale]/(public)/training-guide/page.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	TRAINING_GUIDE_TITLE,
	TRAINING_GUIDE_INTRO,
	TRAINING_GUIDE_SECTIONS,
	type TrainingResource,
} from '@/lib/training-guide-data'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function ResourceList({ items }: { items: TrainingResource[] }) {
	return (
		<ul className="space-y-2">
			{items.map((it, idx) => (
				<li key={idx} className="flex items-start gap-3 text-sm">
					{/* Empty checkbox decoration */}
					<span
						className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 bg-background"
						aria-hidden
					/>

					<div className="min-w-0">
						{it.href ? (
							<a
								href={it.href}
								className="text-primary font-medium hover:underline break-words"
								target="_blank"
								rel="noreferrer"
							>
								{it.label}
							</a>
						) : (
							<span className="break-words">{it.label}</span>
						)}
					</div>
				</li>
			))}
		</ul>
	)
}

export default function TrainingGuidePage() {
	return (
		<div className="p-4 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Training Guide</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					{TRAINING_GUIDE_TITLE}
				</p>
			</div>

			{/* Intro / notes */}
			<Card>
				<CardContent className="space-y-3 pt-6">
					{TRAINING_GUIDE_INTRO.map((p, idx) => (
						<p key={idx} className="text-sm">
							{p}
						</p>
					))}
				</CardContent>
			</Card>

			{/* Sections */}
			<Card>
				<CardContent className="space-y-4 pt-6">
					<h2 className="text-xl font-semibold">Training Sections</h2>
					<Link href="https://docs.google.com/document/d/1mYsK_qqDQfFNSpGZIsGK7Icg_6Hyd6WVkFQA6Vt2tvA/edit?usp=sharing">
						<Button variant="default">Download this for printing</Button>
					</Link>
					<Accordion type="multiple" className="w-full">
						{TRAINING_GUIDE_SECTIONS.map((section) => (
							<AccordionItem key={section.id} value={section.id}>
								<AccordionTrigger className="text-left">
									{section.title}
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									<ResourceList items={section.items} />
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>Another Option</CardHeader>
				<CardContent className="space-y-2">
					<Link
						className="font-bold underline"
						href="https://www.familysearch.org/en/fieldops/familysearch-center-workers-and-volunteers-learning-resources"
					>
						The FamilySearch Center Workers and Volunteers Learning Resources
					</Link>
					<p className="text-sm">
						This is the training guide put together by FamilySearch with ten
						different topics and multiple articles and videos for assistance in
						learning how to use FamilySearch. But also a great resource for
						specific questions relating to FamilySearch.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
