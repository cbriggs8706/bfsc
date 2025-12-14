// app/[locale]/(public)/groups/page.tsx
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
				<h1 className="text-3xl font-bold">Group Visits</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Families, youth groups, church organizations, and community groups are
					welcome to schedule activities at the FamilySearch Center.
				</p>
			</div>

			{/* Scheduling Info */}
			<Card>
				<CardContent className="space-y-3">
					<p>
						Appointments are available during regular hours, evenings, Fridays,
						and weekends. To see if your date and time are available, please
						check the calendar — all group visits are shown there.
					</p>
					<Link
						href={`/${locale}/calendar`}
						className="inline-flex items-center text-primary font-medium hover:underline"
					>
						View Calendar →
					</Link>
				</CardContent>
			</Card>

			{/* Community Groups */}
			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">Community Groups</h2>
					<p>
						Community groups are welcome. We offer specialized classes to meet
						your group’s needs.
					</p>
					<ul className="list-disc pl-5 text-sm space-y-1">
						<li>Minimum of 5 people</li>
						<li>Can accommodate 40–80 people depending on the activity</li>
					</ul>
					<p className="text-sm">
						Please contact one of the Stake Assistants listed below or{' '}
						<strong>Melani (208) 431-0457</strong>.
					</p>
				</CardContent>
			</Card>

			{/* Youth Groups */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">
						Church of Jesus Christ of Latter-day Saints – Youth Groups
					</h2>
					<p>
						Wednesday evenings are available for youth groups. Groups of around
						20 or fewer are preferred for a more hands-on experience, with a
						maximum of 40 youth.
					</p>
					<p className="text-sm">
						All youth reservations must be made at least one week in advance
						through <strong>Trina (208) 242-6217</strong>.
					</p>
					<p className="text-sm italic">
						Each participant should bring their FamilySearch (or Church) login
						name and password.
					</p>
				</CardContent>
			</Card>

			{/* Youth Options */}
			<Card>
				<CardContent className="space-y-4">
					<h3 className="text-lg font-semibold">Youth Activity Options</h3>
					<ul className="space-y-2 text-sm">
						<li>
							<strong>Know Your FamilySearch Center</strong> – Learn to use
							Ordinances Ready, family history activities, and the Recording
							Room.
						</li>
						<li>
							<strong>Connecting Families</strong> – Attach sources and ensure
							all family members are accurately connected.
						</li>
						<li>
							<strong>Love Your Cousins</strong> – Use Ordinances Ready and
							descendancy research to complete temple work.
						</li>
						<li>
							<strong>Ancestral Hometown Project</strong> – Explore an
							ancestor’s hometown using maps, fan charts, Google, and Goldie
							May.
						</li>
						<li>
							<strong>Family Heirlooms</strong> – Enhance, colorize, repair, and
							preserve photos and stories using free photo tools.
						</li>
						<li>
							<strong>Get Involved</strong> – Learn Quick Name Review, Full Name
							Review, and other volunteer opportunities.
						</li>
						<li>
							<strong>NEW: Burley Idaho Temple Journey Guidebook</strong> –
							Bring youth to work on their temple journey guidebooks.
						</li>
					</ul>
					<p className="text-sm italic">
						If youth wish to come on a night other than Wednesday, please
						contact your Stake Assistants.
					</p>
				</CardContent>
			</Card>

			{/* YSA Groups */}
			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">YSA Groups</h2>
					<p>Monday nights are available primarily for YSA groups.</p>
					<p className="text-sm">
						All YSA reservations are made through{' '}
						<strong>Melani (208) 431-0457</strong>.
					</p>
				</CardContent>
			</Card>

			{/* Other Church Groups */}
			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">Other Church Groups</h2>
					<p>
						For wards, stakes, and committees, please contact your Stake
						Assistants to arrange staffing and accommodations.
					</p>
					<ul className="list-disc pl-5 text-sm space-y-1">
						<li>Indexing activities</li>
						<li>Full Name Review</li>
						<li>Get Involved App</li>
						<li>Record Linking Lab</li>
						<li>Consultant & committee training</li>
						<li>Facility tours</li>
						<li>Memory digitizing devices</li>
					</ul>
				</CardContent>
			</Card>

			{/* Stake Contacts */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">Stake Assistants</h2>
					<div className="grid gap-3 text-sm md:grid-cols-2">
						<div>
							<strong>Burley Stake</strong>
							<p>Jamie Palmer – 208-431-6580</p>
						</div>
						<div>
							<strong>Burley Central Stake</strong>
							<p>Lonnie Downs – 208-312-3949</p>
							<p>Gay Downs – 208-312-5130</p>
						</div>
						<div>
							<strong>Burley West Stake</strong>
							<p>Brad Harrop – 843-729-9622</p>
							<p>Tookie Harrop – 843-729-6247</p>
						</div>
						<div>
							<strong>Declo Stake</strong>
							<p>Celia Turner – 208-431-2086</p>
						</div>
						<div>
							<strong>Oakley Stake</strong>
							<p>Sharon Bowers – 208-670-4400</p>
							<p>Carla Carson – 208-678-8204</p>
						</div>
						<div>
							<strong>Paul Stake</strong>
							<p>Arlen Morgan – 208-300-0297</p>
							<p>Lois Morgan – 208-300-0522</p>
						</div>
						<div>
							<strong>Rupert Stake</strong>
							<p>Jolene Hunsaker – 208-431-6642</p>
							<p>Charlotte Reedy – 208-431-1864</p>
						</div>
						<div>
							<strong>Rupert West Stake</strong>
							<p>Layne Rutschke – 208-431-6510</p>
							<p>Janie Rutschke – 208-431-6514</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
