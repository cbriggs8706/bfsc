// app/[locale]/(public)/community-projects/page.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COMMUNITY_PROJECTS } from '@/lib/community-projects.data'
import Link from 'next/link'

export default function CommunityProjectsPage() {
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
			<Card>
				<CardHeader className="text-xl font-bold">
					Cassia Museum General Photos{' '}
				</CardHeader>
				<CardContent className="flex flex-wrap gap-4">
					<p>
						There are sixteen binders of photos being digitized and will be
						uploaded to FamilySearch in the following albums. Please feel free
						to attach to whomever you can identify in the photos.{' '}
					</p>
					<Link
						href="https://www.familysearch.org/photos/gallery/album/1110119?cid=mem_copy"
						target="_blank"
					>
						<Button>Albion Photos</Button>
					</Link>

					<Link
						href="https://www.familysearch.org/photos/gallery/album/1108810"
						target="_blank"
					>
						<Button>Burley Photos</Button>
					</Link>

					<Link
						href="https://www.familysearch.org/photos/gallery/album/1123865?cid=mem_copy"
						target="_blank"
					>
						<Button>Declo Photos</Button>
					</Link>

					<Link
						href="https://www.familysearch.org/photos/gallery/album/1110122?cid=mem_copy"
						target="_blank"
					>
						<Button>Elba/Almo Photos</Button>
					</Link>

					<Link
						href="https://www.familysearch.org/photos/gallery/album/1110123?cid=mem_copy"
						target="_blank"
					>
						<Button>Malta Photos</Button>
					</Link>

					<Link
						href="https://www.familysearch.org/photos/gallery/album/1110120?cid=mem_copy"
						target="_blank"
					>
						<Button>Oakley Photos</Button>
					</Link>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Cassia Museum Negative Collection
				</CardHeader>
				<CardContent>
					<p>
						(note- thousands more will be added as they are digitized) Some of
						the persons in the photos have not been identified. Others photos
						have names or have been identified, but are awaiting to be tagged
						(and thus attached) to FamilySearch. Due to the number of photos,
						the collection has been split into alphabetical listing by last
						name. For written instructions on assisting in with the album
						projects,{' '}
						<Link
							href="https://burleyfamilyhistorycenter.blogspot.com/p/community-projects-helps.html"
							target="_blank"
						>
							click here.
						</Link>{' '}
					</p>
					<p>
						<Link
							href="https://drive.google.com/file/d/1eqZBkBruqIiSni16DEs9OC9AEH2dID1x/view?usp=share_link"
							target="_blank"
						>
							Link to Powerpoint about attaching these photos.
						</Link>
					</p>
					<div className="flex flex-wrap gap-4">
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1123854?cid=mem_copy"
							target="_blank"
						>
							<Button>A</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1123859?cid=mem_copy"
							target="_blank"
						>
							<Button>B</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1229090?cid=mem_copy"
							target="_blank"
						>
							<Button>C</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1233578?cid=mem_copy"
							target="_blank"
						>
							<Button>D</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1236216?cid=mem_copy"
							target="_blank"
						>
							<Button>E</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1241326?cid=mem_copy"
							target="_blank"
						>
							<Button>F</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1262560?cid=mem_copy"
							target="_blank"
						>
							<Button>G</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1278376?cid=mem_copy"
							target="_blank"
						>
							<Button>H</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1278378?cid=mem_copy"
							target="_blank"
						>
							<Button>I</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1282851?cid=mem_copy"
							target="_blank"
						>
							<Button>J</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1286376?cid=mem_copy"
							target="_blank"
						>
							<Button>K</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/photos/gallery/album/1286423?cid=mem_copy"
							target="_blank"
						>
							<Button>L</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1301649"
							target="_blank"
						>
							<Button>M</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1365060"
							target="_blank"
						>
							<Button>N</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1365911"
							target="_blank"
						>
							<Button>O</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369298"
							target="_blank"
						>
							<Button>P</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369299"
							target="_blank"
						>
							<Button>Q</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369308"
							target="_blank"
						>
							<Button>R</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369300"
							target="_blank"
						>
							<Button>S</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369301"
							target="_blank"
						>
							<Button>T</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369303"
							target="_blank"
						>
							<Button>U</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369302"
							target="_blank"
						>
							<Button>V</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369304"
							target="_blank"
						>
							<Button>W</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369305"
							target="_blank"
						>
							<Button>X</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369306"
							target="_blank"
						>
							<Button>Y</Button>
						</Link>
						<Link
							href="https://www.familysearch.org/en/memories/gallery/album/1369307"
							target="_blank"
						>
							<Button>Z</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">Find a Grave</CardHeader>
				<CardContent className="flex flex-wrap gap-4">
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Cassia%2C%20Idaho%2C%20United%20States&f.collectionId=2221801"
						target="_blank"
					>
						<Button>Cassia</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Minidoka%2C%20Idaho%2C%20United%20States&f.collectionId=2221801"
						target="_blank"
					>
						<Button>Minidoka</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?f.collectionId=2221801&q.anyPlace=HAzelton%2C%20Jerome%2C%20%20Idaho%2C%20United%20States"
						target="_blank"
					>
						<Button>Hazelton</Button>
					</Link>
				</CardContent>
			</Card>
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
				<CardHeader className="text-xl font-bold">Censuses</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.residencePlace=cassia%2C%20idaho%2C%20united%20states&f.collectionId=1417683"
						target="_blank"
					>
						<Button>1880 Cassia</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.residencePlace=Alturas%2C%20idaho%2C%20united%20states&f.collectionId=1417683"
						target="_blank"
					>
						<Button>1880 Alturas</Button>
						<span>(Minidoka was part of this county in 1880)</span>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Cassia%2C%20Idaho%2C%20United%20States&f.collectionId=1325221"
						target="_blank"
					>
						<Button>1900 Cassia</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Lincoln%2C%20Idaho%2C%20United%20States&f.collectionId=1325221"
						target="_blank"
					>
						<Button>1900 Lincoln</Button>
						<span>(Minidoka was part of this county in 1900)</span>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&offset=400&q.anyPlace=Cassia%2C%20Idaho%2C%20United%20States&f.collectionId=1727033"
						target="_blank"
					>
						<Button>1910 Cassia</Button>
					</Link>
					<Link
						href="https://www.familysearch.org/search/record/results?count=100&q.anyPlace=Lincoln%2C%20Idaho%2C%20United%20States&f.collectionId=1727033"
						target="_blank"
					>
						<Button>1910 Lincoln</Button>
						<span>(Minidoka was part of this county in 1910)</span>
					</Link>
					<Link
						href="https://docs.google.com/spreadsheets/d/1ZsQaVa7y7vEw6odhZYxMAAoBrwGlbj0qMo8VAT2lvfE/edit#gid=45147058"
						target="_blank"
					>
						<Button>Cameron&apos;s spreadsheet for Cassia County</Button>
					</Link>
					<Link
						href="https://www.youtube.com/watch?v=3cCOP8-IvBM"
						target="_blank"
					>
						<Button>Joe Price explain the creation of the spreadsheet</Button>
					</Link>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Magic Valley WWII Newspaper Clippings
				</CardHeader>
				<CardContent>
					<Link
						href="https://www.familysearch.org/photos/gallery/album/1108809"
						target="_blank"
					>
						<Button>Link</Button>
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
