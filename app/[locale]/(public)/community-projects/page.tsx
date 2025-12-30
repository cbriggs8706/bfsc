// app/[locale]/(public)/community-projects/page.tsx
import { ProjectCardExpanded } from '@/components/admin/projects/ProjectCardExpanded'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { readProjectSummariesExpanded } from '@/lib/actions/projects/projects'
import Link from 'next/link'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CommunityProjectsPage({ params }: Props) {
	const { locale } = await params
	const projects = await readProjectSummariesExpanded()
	console.log(projects[3])
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Community Projects</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					Ongoing community projects you can help with through the Burley
					FamilySearch Center.
				</p>
			</div>
			<Card>
				<CardContent>
					We are so blessed to live in a great community. Founded and settled by
					many dedicated people. The Burley FamilySearch Center is undertaking
					some community projects to document the lives of persons who lived
					here. There are some unique unindexed databases in FamilySearch
					needing to be attached as sources. The center has partnered with the
					Cassia County Museum to digitize things contained in their
					collections. When we finish with Cassia Museum, we will be working
					with the Minidoka Museum. These include photos, negatives, slides, and
					oral histories. Other options will include obituaries and cemeteries
					of the area. We are open to partnering with other organizations. If
					you know of some group who would like to be a part of this community
					project, please contact the center.{' '}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					There are three ways to help with these projects.
				</CardHeader>

				<CardContent>
					<ol>
						<li>
							Click on the links below to be taken to specific databases or
							albums created for these projects. NOTE: Be sure to have signed
							into FamilySearch prior to opening any of the databases or albums
							below.
						</li>
						<li>
							Projects by Dennis Yancey. He has two main projects. One group is
							attempting to collect all of the family bibles (and samplers) they
							can find. The other group is working with African American
							Artifacts. These are then uploaded to FamilySearch for volunteers
							to tag.
						</li>
						<li>
							Check out Cameron Briggs&apos; website Community Linking about
							community projects for other options and ideas.
						</li>
					</ol>
					<p>
						For help in attaching sources, check out Cameron Briggs&apos;{' '}
						<Link href="https://www.sourcelinker101.com">
							SourceLinker101.com
						</Link>{' '}
						website
					</p>
				</CardContent>
			</Card>
			<ProjectCardExpanded projects={projects} locale={locale} />

			<Card>
				<CardHeader className="text-xl font-bold">
					Mini-Cassia Cemeteries
				</CardHeader>
				<CardContent>
					<Link
						href="https://docs.google.com/spreadsheets/d/19khMXDN5nnQ8jsXGP7i_MferOX8TCLZnPHGR-hJbh0I/edit?usp=sharing"
						target="_blank"
					>
						<Button>Spreadsheet</Button>
					</Link>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="text-xl font-bold">
					Naturalization Records
				</CardHeader>
				<CardContent className="flex flex-wrap gap-4">
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Minidoka%2C%20Idaho%2C%20United%20States&f.collectionId=2078306"
						target="_blank"
					>
						<Button>Minidoka</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Cassia%2C%20Idaho%2C%20United%20States&f.collectionId=2078306"
						target="_blank"
					>
						<Button>Cassia</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=alturas%2C%20idaho%2C%20united%20states&f.collectionId=2078306"
						target="_blank"
					>
						<Button>Alturas (Minidoka)</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=lincoln%2C%20idaho%2C%20united%20states&f.collectionId=2078306"
						target="_blank"
					>
						<Button>Lincoln (Minidoka)</Button>
					</Link>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">Numident</CardHeader>
				<CardContent>
					Finished. Thanks to everyone who helped with this project.{' '}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Obituaries of the Mini-Cassia Area
				</CardHeader>
				<CardContent>
					The currently uploaded ones have been assigned or completed. Watch for
					more in the future.
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">Oral Histories</CardHeader>
				<CardContent>
					<p>
						Check back as more will be added as they are processed. Several oral
						histories were recorded in the 1970&apos;s for the Cassia County
						Historical Society Museum. As they are digitized, they will be
						uploaded to FamilySearch to the interviewee&apos;s page. Please feel
						free to listen to these histories and add in tags for anyone
						discussed in the history.
					</p>
					<Link
						href="https://www.familysearch.org/photos/gallery/album/1110117"
						target="_blank"
					>
						<Button>Link</Button>
					</Link>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Dennis Yancey&apos;s Projects
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div>
						<Link
							href="https://yanceyfamilygenealogy.org/genealogical_service_project.htm"
							target="_blank"
						>
							<Button>Family Bible Preservation Project</Button>
							<p className="ml-2">
								This page includes basis information about the project and some
								instructions on how to become involved.
							</p>
						</Link>
					</div>
					<div>
						<Link
							href="https://yanceyfamilygenealogy.org/African_American_FS.htm"
							target="_blank"
						>
							<Button>African American Records Project</Button>
							<p className="ml-2">A sister-project to the above</p>
						</Link>
					</div>
					<div>
						<Link
							href="https://yanceyfamilygenealogy.org/family_bible_index.htm"
							target="_blank"
						>
							<Button>Family Bible Index</Button>
							<p className="ml-2">
								Also check out the index to see if any Family Bible Records
								exist for your surnames of interest.{' '}
							</p>
						</Link>
					</div>
				</CardContent>
			</Card>
			{/* {COMMUNITY_PROJECTS.map((section) => (
				<Card key={section.title}>
					<CardHeader>
						<CardTitle>{section.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{section.items.map((item, idx) => (
								<li key={idx} className="flex items-start gap-3 text-base">
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
			))} */}
		</div>
	)
}
