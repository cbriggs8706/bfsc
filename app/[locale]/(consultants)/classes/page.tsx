// app/[locale]/(consultants)/classes/page.tsx
import { Card, CardContent } from '@/components/ui/card'
import { listSeriesForTable } from '@/db/queries/classes'
import { ClassesTable } from '@/components/classes/ClassesTable'
import { requireCurrentUser } from '@/utils/require-current-user'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function ClassesPage({ params }: Props) {
	const { locale } = await params

	// Optional: logged-in user for permissions
	// Page itself can be public, but actions depend on auth
	let currentUser = null
	try {
		currentUser = await requireCurrentUser()
	} catch {
		// not logged in — fine
	}

	const classes = await listSeriesForTable()

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Classes</h1>
					<p className="text-sm text-muted-foreground">
						Upcoming and past classes offered by the center
					</p>
				</div>
			</div>
			<Card>
				<CardContent>
					<ClassesTable
						classes={classes}
						locale={locale}
						currentUser={currentUser}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
