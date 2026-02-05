// app/[locale]/(public)/groups/page.tsx
import { GroupActivities } from '@/components/resource/GroupActivities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SocialMediaConsentDialog } from '@/components/forms/SocialMediaConsentDialog'
import { readAllResources } from '@/lib/actions/resource/resource'
import Link from 'next/link'
import { getFaithTree } from '@/db/queries/faiths'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Resource } from '@/types/resource'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function ClassesPage({ params }: Props) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const { items } = await readAllResources({
		type: 'activity',
		page: 1,
		pageSize: 200,
	})
	const { items: reservationItems } = await readAllResources({
		page: 1,
		pageSize: 200,
	})
	const centerTime = await getCenterTimeConfig()
	const faithTree = await getFaithTree()

	// public page: only active
	const active = items.filter((r) => r.isActive)
	const reservationResources = reservationItems.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

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

			<GroupActivities
				items={active}
				locale={locale}
				reservationData={{
					resources: reservationResources,
					faithTree,
					timeFormat: centerTime.timeFormat,
				}}
				canReserve={Boolean(session)}
				loginHref={`/${locale}/login?redirect=/${locale}/groups`}
			/>

			{/* Scheduling Info */}
			{/* <Card>
				<CardContent className="space-y-3">
					<p>
						Appointments are available during regular hours, evenings, Fridays,
						and weekends. To see if your date and time are available, please
						check the calendar — all group visits are shown there.
					</p>
					<Link href={`/${locale}/calendar`}>
						<Button>View Calendar</Button>
					</Link>
				</CardContent>
			</Card> */}

			<Card>
				<CardContent className="space-y-3">
					<h2 className="text-xl font-semibold">Social Media Photo Consent</h2>
					<p>
						If your group grants permission for photos to be used on our social
						media, please complete the release form below.
					</p>
					<SocialMediaConsentDialog />
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Community Groups */}
				<Card>
					<CardContent className="space-y-3">
						<h2 className="text-xl font-semibold">Community Groups</h2>
						<p>
							Community groups are welcome. We offer specialized classes to meet
							your group’s needs.
						</p>
						<ul className="list-disc pl-5 text-base space-y-1">
							<li>Minimum of 5 people</li>
							<li>Can accommodate 40–80 people depending on the activity</li>
						</ul>
						<p className="text-base">
							Please contact one of the Stake Assistants listed below or{' '}
							<Link href="tel:+12084310457">
								<Button className="ml-2">Melani (208) 431-0457</Button>
							</Link>
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
							Wednesday evenings are available for youth groups. Groups of
							around 20 or fewer are preferred for a more hands-on experience,
							with a maximum of 40 youth.
						</p>
						<p className="text-base">
							All youth reservations must be made at least one week in advance
							through
							<Link href="tel:+12082426217">
								<Button className="ml-2">Trina (208) 242-6217</Button>
							</Link>
						</p>
						<p className="text-base italic">
							Each participant should bring their FamilySearch (or Church) login
							name and password.
						</p>
					</CardContent>
				</Card>

				{/* Youth Options */}
				{/* <Card>
				<CardContent className="space-y-4">
					<h3 className="text-lg font-semibold">Youth Activity Options</h3>
					<ul className="space-y-2 text-base">
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
					<p className="text-base italic">
						If youth wish to come on a night other than Wednesday, please
						contact your Stake Assistants.
					</p>
				</CardContent>
			</Card> */}

				{/* YSA Groups */}
				<Card>
					<CardContent className="space-y-3">
						<h2 className="text-xl font-semibold">YSA Groups</h2>
						<p>Monday nights are available primarily for YSA groups.</p>
						<p className="text-base">
							All YSA reservations are made through
							<Link href="tel:+12084310457">
								<Button className="ml-2">Melani (208) 431-0457</Button>
							</Link>
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
						<ul className="list-disc pl-5 text-base space-y-1">
							<li>Indexing activities</li>
							<li>Full Name Review</li>
							<li>Get Involved App</li>
							<li>Record Linking Lab</li>
							<li>Worker & committee training</li>
							<li>Facility tours</li>
							<li>Memory digitizing devices</li>
						</ul>
					</CardContent>
				</Card>
			</div>
			{/* Stake Contacts */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">Stake Assistants</h2>
					<div className="grid gap-3 text-base md:grid-cols-2">
						<div className="flex flex-col gap-2">
							<strong>Burley Stake</strong>

							<Link href="tel:+12084316510">
								<Button>Jamie Palmer – 208-431-6580</Button>
							</Link>
						</div>

						<div className="flex flex-col gap-2">
							<strong>Burley Central Stake</strong>

							<Link href="tel:+12083123949">
								<Button>Lonnie Downs – 208-312-3949</Button>
							</Link>
							<Link href="tel:+12083125130">
								<Button>Gay Downs – 208-312-5130</Button>
							</Link>
						</div>

						<div className="flex flex-col gap-2">
							<strong>Burley West Stake</strong>

							<Link href="tel:+18437299622">
								<Button>Brad Harrop – 843-729-9622</Button>
							</Link>
							<Link href="tel:+18437296247">
								<Button>Tookie Harrop – 843-729-6247</Button>
							</Link>
						</div>

						<div className="flex flex-col gap-2">
							<strong>Declo Stake</strong>

							<Link href="tel:+12084312086">
								<Button>Celia Turner – 208-431-2086</Button>
							</Link>
						</div>

						<div className="flex flex-col gap-2">
							<strong>Oakley Stake</strong>

							<Link href="tel:+12086704400">
								<Button>Sharon Bowers – 208-670-4400</Button>
							</Link>
							<Link href="tel:+12086788204">
								<Button>Carla Carson – 208-678-8204</Button>
							</Link>
						</div>

						<div className="flex flex-col gap-2">
							<strong>Paul Stake</strong>

							<Link href="tel:+12083000297">
								<Button>Arlen Morgan – 208-300-0297</Button>
							</Link>
							<Link href="tel:+12083000522">
								<Button>Lois Morgan – 208-300-0522</Button>
							</Link>
						</div>
						<div className="flex flex-col gap-2">
							<strong>Rupert Stake</strong>

							<Link href="tel:+12084316642">
								<Button>Jolene Hunsaker – 208-431-6642</Button>
							</Link>
							<Link href="tel:+12084311864">
								<Button>Charlotte Reedy – 208-431-1864</Button>
							</Link>
						</div>
						<div className="flex flex-col gap-2">
							<strong>Rupert West Stake</strong>

							{/* <Link href="tel:+12084316510">
								<Button>Layne Rutschke – 208-431-6510</Button>
							</Link>
							<Link href="tel:+12084316514">
								<Button>Janie Rutschke – 208-431-6514</Button>
							</Link> */}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
