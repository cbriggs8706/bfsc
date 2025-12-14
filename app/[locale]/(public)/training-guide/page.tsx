// app/[locale]/(public)/training-guide/page.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'

type Resource = {
	label: string
	href?: string // Option A: only include if explicitly present
	note?: string
}

type Section = {
	id: string
	title: string
	intro?: string
	items: Resource[]
}

const SECTIONS: Section[] = [
	{
		id: 'accounts',
		title: 'Accounts',
		items: [
			{ label: 'Log into FamilySearch and personalize your settings' },
			{ label: 'BYU Family History Tutorial -Registration and Settings' },
			{ label: 'Family History Guide Project 1 Goal 13 - Choice A' },
			{ label: 'How to set up a new account' },
			{ label: 'BYU Family History Tutorial - Registration and Settings' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'How to help someone recover a password or username.' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Creating a child’s account' },
			{ label: 'FamilySearch Knowledge Article' },
		],
	},
	{
		id: 'navigating',
		title: 'Navigating FamilySearch',
		items: [
			{
				label:
					'Navigate the home page (including the magic button - return to home page when clicking on FamilySearch icon)',
			},
			{ label: 'BYU Family History Tutorial  -FamilySearch Homepage' },
			{
				label: 'Family History Guide Project 1 Goal 1- Navigating FamilySearch',
			},
			{ label: 'Navigating FamilySearch Quiz' },
			{ label: 'FamilySearch Knowledge Article' },
			{
				label:
					'Open and navigate the Tree views [Landscape, Portrait, Fan Chart (including all options) and Descendancy]',
			},
			{ label: 'BYU Family History Tutorial - FamilySearch Pedigree Views' },
			{ label: 'Family History Guide Project 1 Goal 5 -  Choices A and B' },
			{ label: 'FamilySearch Knowledge Article- Different Views' },
			{ label: 'Understand the Privacy Rules for FamilySearch' },
			{ label: 'Family History Guide Project 1 Goal 1- Choice E' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Navigate a Summary Card' },
			{ label: 'Family History Guide Project 1 Goal 2 - Choice A' },
			{ label: 'Navigate a Person Page' },
			{ label: 'Family History Guide Project 1 Goal 2  - Choice B' },
			{ label: 'Family History Guide Project 1 Goal 3 - Choices B and C' },
			{ label: 'FamilySearch Knowledge Article - New Person Page August 2022' },
			{ label: 'FamilySearch Knowledge Article -Person Page FAQ' },
			{ label: 'Find someone in your Family Tree- by name and by ID' },
			{ label: 'Family History Guide Project 1 Goal 4 - Choice A' },
			{
				label: 'FamilySearch Blog Article - Using Person ID (old screenshots)',
			},
			{ label: 'Use the Recent Menu' },
			{ label: 'Family History Guide Project 1 Goal 4 - Choice B' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Adding People to FamilySearch' },
			{ label: 'Family History Guide Project 1 Goal 7 - Choices A and B' },
			{ label: 'FamilySearch Knowledge Article - Adding a spouse' },
			{ label: 'FamilySearch Knowledge Article - Adding a child' },
			{ label: 'FamilySearch Knowledge Article - Adding a parent' },
			{
				label:
					'FamilySearch Knowledge Article - Adding step, foster, adoptive child',
			},
			{
				label:
					'Optional- Complete Project #1 Activity in beta.familysearch.org to add persons  Project #1 Activity',
			},
		],
	},
	{
		id: 'editing',
		title: 'Editing on FamilySearch',
		items: [
			{ label: 'Editing person vitals, marriage, and relationships' },
			{ label: 'FamilySearch Knowledge Article - Edit vital information' },
			{ label: 'FamilySearch Knowledge Article - Edit children relationships' },
			{
				label:
					'FamilySearch Knowledge Article - Edit or add marriage information',
			},
			{ label: 'Standardization of dates and places' },
			{ label: 'FamilySearch Knowledge Article - Standardization information' },
			{ label: 'Editing Teaching/Learning Options' },
			{
				label: 'BYU Family History Tutorials - Editing Facts and Relationships',
			},
			{ label: 'Family History Guide Project 1 Goal 6 - All Choices' },
			{
				label:
					'Optional  - Complete Project #2 Activity in beta.familysearch.org to practice editing relationships.   Project #2 Activity',
			},
		],
	},
	{
		id: 'sources',
		title: 'Sources on FamilySearch',
		items: [
			{ label: 'How to use the Record Hints' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'How to use the Tasks' },
			{ label: 'FamilySearch Knowledge Article' },
			{
				label:
					'How to search on FamilySearch and Ancestry using those options on the Person Page, including using the filters',
			},
			{ label: 'FamilySearch Blog Article - Using the Search Page' },
			{
				label:
					'How to use RecordSeek to attach sources from ancestry (or other websites) to FamilySearch',
			},
			{ label: 'FamilySearch Wiki Article' },
			{ label: 'Record Seek website' },
			{
				label:
					'YouTube Video on using Record Seek- this is from 2018 so screenshots are old, but the process is the same.',
				note: 'Older screenshots',
			},
			{ label: "Alice Child's Article with screenshots" },
			{ label: 'How to use the “Similar Historical Records Tool”' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'FamilySearch Blog Article - old screen shots' },
		],
	},
	{
		id: 'sources-teaching',
		title: 'Sources — Teaching/Learning Options',
		items: [
			{ label: 'BYU Family History Tutorials - FamilySearch.org' },
			{ label: 'BYU Family History Tutorials  - Adding Sources' },
			{ label: 'Family History Guide Project 1 Goal 8 - Add Sources' },
			{
				label:
					'Family History Guide Project 1 Goal 9 - All Choices - Record Hints and Attaching Sources',
			},
			{ label: 'FamilySearch Knowledge Article- Attaching Historical Records' },
			{
				label:
					'SourceLinking101- Several short videos done by Cameron Briggs for different skill levels and many different options.',
			},
			{
				label:
					'Using GoldieMay - Short 4 minute video   Longer 65 minute video                 Link to download extension',
			},
		],
	},
	{
		id: 'merge-separate',
		title: 'Merging and Separating on FamilySearch',
		items: [
			{
				label:
					'Merging [Use beta.familysearch.org to find and merge duplicates]',
			},
			{ label: 'BYU Family History Tutorials - Merging Duplicates' },
			{ label: 'Family History Guide Project 1 Goal 11- Merging' },
			{ label: 'FamilySearch Knowledge Article - Are they the same person?' },
			{ label: 'FamilySearch Knowledge Article - Using Merge by ID' },
			{
				label:
					'Optional- Complete Project #3 Activity in beta.familysearch.org to practice merging.   Project #3 Activity',
			},
			{
				label:
					'*** When training to this point is complete, if the trainee feels comfortable enough, they are encouraged to begin working a regular shift at the center.  Then continue working to complete the remainder of the training guide.***',
				note: 'Milestone',
			},
			{ label: 'Separating' },
			{
				label:
					'FamilySearch Knowledge Article - Fixing a record with multiple people',
			},
			{ label: 'FamilySearch Knowledge Article - Undo a merge' },
		],
	},
	{
		id: 'temple',
		title: 'Temple Ordinances',
		items: [
			{ label: 'How to use Ordinances Ready' },
			{ label: 'BYU Family History Tutorial - Using Ordinance Ready' },
			{ label: 'Family History Guide LDS Goal 2 - Choice A' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Temple Reservation Policies' },
			{ label: 'Family History Guide LDS Goal 1- Choice C' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Information required to Temple Ordinances' },
			{ label: 'FamilySearch Knowledge Article' },
			{
				label:
					'110 year rule : what it is and how to provide permission [copies in the binder on the reception desk]',
			},
			{ label: 'Family History Guide LDS Goal 1- Choice C' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Temple icons and their meanings' },
			{ label: 'Family History Guide LDS Goal 1- Choice A' },
			{ label: 'FamilySearch Knowledge Article' },
			{
				label: 'Importance of sharing temple ordinances with the temple',
			},
			{ label: 'Family History Guide LDS Goal 6 - Choices A and B' },
			{ label: 'FamilySearch Knowledge Article' },
		],
	},
	{
		id: 'memories',
		title: 'Memories',
		items: [
			{ label: 'Memories' },
			{ label: 'BYU Family History Tutorials - Adding Memories' },
			{ label: 'How to browse Memories for an individual person' },
			{ label: 'Family History Guide Project 2 Goal 4' },
			{
				label:
					'How to use the fan chart to find ancestors with stories and photos [Use the fan chart option and the stories/photo filters]',
			},
			{ label: 'How to change a portrait photo' },
			{ label: 'Family History Guide Project 2 Goal 4 - Choice B' },
			{
				label:
					'How to upload memories to the gallery and/or to a specific person',
			},
			{ label: 'Family History Guide Project 2 Goal 5  - Choice A' },
			{
				label:
					'FamilySearch Knowledge Article - Uploading Photos and Documents',
			},
			{
				label:
					'How to tag, edit, add information to, and the way to manipulate a photo in FamilySearch',
			},
			{
				label: 'Family History Guide Project 2 Goal 6 Choices B, C, D, and E',
			},
			{ label: 'FamilySearch Knowledge Article - Adding Photo to Stories' },
			{ label: 'How to add Documents' },
			{ label: 'Family History Guide Project 2 Goal 7' },
			{
				label:
					'FamilySearch Knowledge Article - Adding Documents and Photos (same as above)',
			},
			{ label: 'How to add Stories' },
			{ label: 'Family History Guide Project 2 Goal 8' },
			{
				label: 'FamilySearch Knowledge Article - How to Tag Stories and Audios',
			},
			{ label: 'How to add Audio' },
			{ label: 'Family History Guide Project 2 Goal 10' },
			{
				label:
					'FamilySearch Knowledge Article - How to Tag Stories and Audios (same as above)',
			},
			{ label: 'How to use the Gallery and Albums' },
			{ label: 'Family History Guide Project 2 Goal 11' },
			{ label: 'How to use the FamilySearch Memories app for memories' },
			{ label: 'Downloading App' },
			{ label: 'Family History Guide Memories App Goal 1 - Choice A' },
			{ label: 'FamilySearch Knowledge Article - Downloading the App' },
			{ label: 'FamilySearch Knowledge Article - What the app does' },
			{ label: 'Uploading Photos with Memories app' },
			{ label: 'Family History Guide Memories App Goal 1  -Choices B, C, D' },
			{ label: 'Adding Documents with Memories app' },
			{ label: 'Family History Guide Memories App Goal 3 -Choice A' },
			{ label: 'Adding Audio with Memories app' },
			{ label: 'Family History Guide Memories App Goal 4 - Choice A' },
		],
	},
	{
		id: 'descendancy',
		title: 'Descendancy Research',
		items: [
			{ label: 'Descendancy View for research options' },
			{ label: 'How to use to find and attach record hints' },
			{ label: 'Family History Guide Project 3 Goal 2' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'How to use for data problems' },
			{ label: 'FamilySearch Knowledge Article (same as above)' },
			{ label: 'Descendancy Research for missing cousins' },
			{ label: 'How to use it to find potential holes in the tree' },
			{
				label:
					'BYU Family History Tutorial - Descendancy Research in FamilySearch',
			},
			{ label: 'Family History Guide Project 3  Goal 1' },
			{ label: 'What is Descendancy Research - Choice A' },
			{ label: 'Choose a Descendancy Ancestor- Choice B' },
			{ label: 'Use Descendancy View- Choice C' },
			{ label: 'Optional- Show how to use Puzzilla' },
			{
				label: 'BYU Family History Tutorial - Descendancy Research in Puzzilla',
			},
			{ label: 'Family History Guide Project 3 Goal 3- Using Puzzilla' },
			{ label: 'FamilySearch Knowledge Article' },
			{ label: 'Family History Fanatics- youtube.com' },
			{ label: 'Descendancy Research Video' },
		],
	},
	{
		id: 'wiki',
		title: 'Using the Research Wiki',
		items: [
			{ label: 'BYU Family History Class - Using the Wiki and Catalog' },
			{ label: 'FamilySearch Knowledge Article - What is the Wiki' },
			{ label: 'FamilySearch Knowledge Article - How to use the Wiki' },
			{ label: 'FamilySearch Knowledge Article - Help finding Ancestors' },
		],
	},
	{
		id: 'help',
		title: 'Using and Finding Help',
		items: [
			{ label: 'Help Center on FamilySearch.org' },
			{ label: 'Family History Guide Project 6 Goal 1 - Choice A' },
			{ label: 'FamilySearch Demo YouTube - Demo of FamilySearch Help' },
			{ label: 'Using Community' },
			{ label: 'Family History Guide Project 6 Goal 1 - Choice A' },
			{ label: 'Connect and Collaborate in Community- Kathryn Grant video' },
			{ label: 'Using Family History Guide' },
			{ label: 'Introduction to Family History Guide' },
			{ label: 'About the Family History Guide' },
			{ label: 'Contact Us' },
		],
	},
	{
		id: 'center-specific',
		title: 'Center-Specific Training',
		items: [
			{ label: 'Scheduling appointments for groups at the center' },
			{ label: 'Youth Appointments- Call/Text Wendy Brown' },
			{ label: 'Other appointments- call/text their own Stake Assistants' },
			{ label: 'Show how to use the Discovery Screens and Recording Studio' },
			{
				label:
					'Specific training for all of the devices at the center is given on a rotating basis- check the calendar for specifics.',
			},
		],
	},
]

function ResourceList({ items }: { items: Resource[] }) {
	return (
		<ul className="space-y-2">
			{items.map((it, idx) => (
				<li key={idx} className="flex items-start gap-3 text-sm">
					{/* empty checkbox decoration */}
					<span
						className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 bg-background"
						aria-hidden
					/>

					<div>
						{it.href ? (
							<a
								href={it.href}
								className="text-primary font-medium hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								{it.label}
							</a>
						) : (
							<span>{it.label}</span>
						)}
						{it.note ? (
							<span className="ml-2 text-muted-foreground">({it.note})</span>
						) : null}
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
					Originally designed for trainers teaching new workers at the center,
					this guide can be used by anyone wanting to learn more about
					FamilySearch. Skip sections you already understand, and choose
					learning options that match your learning style.
				</p>
			</div>

			{/* Notes */}
			<Card>
				<CardContent className="space-y-3">
					<p className="text-sm">
						<strong>Note:</strong> Some articles and activities on the Family
						History Guide haven’t been updated as of{' '}
						<strong>September 1, 2022</strong> to show the new Person Page.
						These are the most updated links available at this time.
					</p>
					<p className="text-sm">
						If you’re completing this on your own and need more help, come to
						the center for one-to-one assistance or attend one of the classes
						offered at the center.
					</p>
				</CardContent>
			</Card>

			{/* Beta practice */}
			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">
						Practice Safely with beta.familysearch.org
					</h2>
					<p className="text-sm">
						beta.familysearch.org is a great option to practice these skills.
						Changes made there do not affect familysearch.org. Use the same
						username and password.
					</p>
					<p className="text-sm text-muted-foreground">
						Because it’s a beta website, sometimes there are issues. If you have
						problems with functionality, wait a couple of days and try the
						activity again.
					</p>
				</CardContent>
			</Card>

			{/* Sections */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">Training Sections</h2>

					<Accordion type="multiple" className="w-full">
						{SECTIONS.map((section) => (
							<AccordionItem key={section.id} value={section.id}>
								<AccordionTrigger className="text-left">
									{section.title}
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									{section.intro ? (
										<p className="text-sm text-muted-foreground mb-3">
											{section.intro}
										</p>
									) : null}
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
