// app/[locale]/admin/center/hours/page.tsx
import { Card, CardContent } from '@/components/ui/card'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CenterHoursForm } from '@/components/admin/hours/CenterHoursForm'
import { db, operatingHours } from '@/db'
import { asc } from 'drizzle-orm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function CenterHoursPage({ params }: Props) {
	const { locale } = await params

	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'Admin') {
		redirect(`/${locale}`)
	}

	const hours = await db
		.select()
		.from(operatingHours)
		.orderBy(asc(operatingHours.weekday))

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Define Regular Center Hours</h1>
				<p className="text-sm text-muted-foreground">
					This is used extensively throughout the site. Be careful making edits.
					Autosaves with each change you make.
				</p>
			</div>

			<Card>
				<CardContent>
					<CenterHoursForm initialRows={hours} />
				</CardContent>
			</Card>
		</div>
	)
}
