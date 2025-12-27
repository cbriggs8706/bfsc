import { Card, CardContent } from '@/components/ui/card'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VisitPurposes } from '@/components/admin/VisitPurposes'
import { db, kioskVisitPurposes } from '@/db'
import { asc } from 'drizzle-orm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function AdminPurposesPage({ params }: Props) {
	const { locale } = await params

	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'Admin') {
		redirect(`/${locale}`)
	}

	const purposes = await db
		.select()
		.from(kioskVisitPurposes)
		.orderBy(asc(kioskVisitPurposes.sortOrder))

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Define Visit Purposes</h1>
				<p className="text-sm text-muted-foreground">
					These will show up in the kiosk when a patron signs in.
				</p>
			</div>

			<Card>
				<CardContent>
					<VisitPurposes initialPurposes={purposes} />
				</CardContent>
			</Card>
		</div>
	)
}
