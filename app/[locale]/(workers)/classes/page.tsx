// app/[locale]/(workers)/classes/page.tsx
import { Card, CardContent } from '@/components/ui/card'
import { listSeriesForTable } from '@/db/queries/classes'
import { ClassesTable } from '@/components/classes/ClassesTable'
import { requireCurrentUser } from '@/utils/require-current-user'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function ClassesPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	// Optional: logged-in user for permissions
	// Page itself can be public, but actions depend on auth
	let currentUser = null
	try {
		currentUser = await requireCurrentUser(locale)
	} catch {
		// not logged in — fine
	}

	const classes = await listSeriesForTable()

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t('classes.title')}</h1>
					<p className="text-sm text-muted-foreground">{t('classes.sub')}</p>
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
