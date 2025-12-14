// app/[locale]/(public)/research-specialists/page.tsx
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function ClassesPage({ params }: Props) {
	const { locale } = await params

	return (
		<div className="p-4 space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold">Research Specialists</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Each shift has consultants who can assist with basic family history
					research and the use of our digitizing equipment. Some consultants
					also have specialized expertise in locations, languages, and tools.
				</p>
			</div>

			{/* Primary Contact */}
			<Card>
				<CardContent className="space-y-3">
					<p className="text-sm">
						For all appointments, contact the center to schedule yours:
					</p>
					<p className="text-base">
						<strong>(208) 878-7286</strong>
					</p>
				</CardContent>
			</Card>

			{/* Weekly Schedule */}
			<Card>
				<CardContent className="space-y-5">
					<h2 className="text-xl font-semibold">Weekly Schedule</h2>

					{/* Monday */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Monday</h3>
							<p className="text-sm text-muted-foreground">12:00–4:00 p.m.</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>
								BillionGraves Transcription — training + help with complex
								issues
							</li>
							<li>Using Audacity (audio editing software)</li>
							<li>Danish and Norwegian research</li>
							<li>English and German research</li>
							<li>Spanish-speaking consultant — Steve</li>
						</ul>
					</div>

					{/* Tuesday */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Tuesday</h3>
							<p className="text-sm text-muted-foreground">
								10:00 a.m.–2:00 p.m.
							</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>
								Danish research — appointment available at 11 a.m. with Carla
							</li>
							<li>Italian and Spanish translations</li>
							<li>Native American research</li>
							<li>
								RootsMagic — including how to use it with FamilySearch.org
							</li>
							<li>Old Gothic writing translations</li>
							<li>Find a Grave</li>
						</ul>
					</div>

					{/* Wednesday AM */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Wednesday</h3>
							<p className="text-sm text-muted-foreground">
								10:00 a.m.–2:00 p.m.
							</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>Norwegian research</li>
							<li>Ancestry — including how to use it with FamilySearch.org</li>
							<li>RootsMagic</li>
						</ul>
					</div>

					{/* Wednesday PM */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Wednesday</h3>
							<p className="text-sm text-muted-foreground">2:00–6:00 p.m.</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>Using Audacity (audio editing software)</li>
							<li>Spanish-speaking consultant — Sharon</li>
							<li>
								Germany, Netherlands, and French Canadian research (not record
								translation)
							</li>
							<li>Ancestry</li>
							<li>RootsMagic</li>
							<li>
								Swedish research — appointments available:
								<ul className="list-disc pl-5 mt-1 space-y-1">
									<li>2 p.m. and 4 p.m. with Kathleen</li>
									<li>2 p.m. with Kristi</li>
								</ul>
							</li>
						</ul>
					</div>

					{/* Thursday AM */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Thursday</h3>
							<p className="text-sm text-muted-foreground">
								10:00 a.m.–2:00 p.m.
							</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>England research — using FindMyPast</li>
							<li>Indexing and Name Review</li>
						</ul>
					</div>

					{/* Thursday PM */}
					<div className="space-y-2">
						<div>
							<h3 className="font-semibold">Thursday</h3>
							<p className="text-sm text-muted-foreground">2:00–6:00 p.m.</p>
						</div>
						<ul className="list-disc pl-5 text-sm space-y-1">
							<li>Indexing</li>
							<li>RootsMagic</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Special Notes */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">Special Notes</h2>

					<div className="space-y-2 text-sm">
						<p>
							<strong>DNA assistance:</strong> Tammy — contact the center for
							her scheduled days.
						</p>
						<p>
							<strong>Zurich, Switzerland marriages (1580–1799):</strong>{' '}
							Contact Russell Bair. He has a thumb drive with marriages indexed
							alphabetically by bride or groom.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Translation Assistance */}
			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">Translation Assistance</h2>

					<p className="text-sm">Translation help may be available for:</p>

					<ul className="list-disc pl-5 text-sm space-y-1">
						<li>German</li>
						<li>Portuguese</li>
						<li>French</li>
						<li>Italian</li>
						<li>Finnish</li>
						<li>Swedish</li>
						<li>Spanish</li>
						<li>Danish</li>
					</ul>

					<p className="text-sm">
						Send page links or copies to:{' '}
						<strong>id_burley@familyhistorymail.org</strong> — or contact the
						center for the contact information for the individual willing to
						assist.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
