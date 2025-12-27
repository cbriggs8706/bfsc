import { Card, CardContent } from '@/components/ui/card'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SpecialHours } from '@/components/admin/hours/SpecialHours'
import { db, specialHours } from '@/db'
import { asc } from 'drizzle-orm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function SpecialHoursAdminPage({ params }: Props) {
	const { locale } = await params

	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'Admin') {
		redirect(`/${locale}`)
	}

	const hours = await db
		.select()
		.from(specialHours)
		.orderBy(asc(specialHours.date))

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Closed Days & Special Hours</h1>
				<p className="text-sm text-muted-foreground">
					Overrides normal center hours for holidays and special events.
				</p>
			</div>

			<Card>
				<CardContent>
					<SpecialHours initialItems={hours} />
				</CardContent>
			</Card>
		</div>
	)
}
