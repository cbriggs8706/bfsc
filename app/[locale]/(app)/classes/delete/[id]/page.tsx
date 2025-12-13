// app/[locale]/(app)/classes/delete/[id]/page.tsx
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { deleteSeries, getSeriesWithSessionsById } from '@/db/queries/classes'
import { requireCurrentUser } from '@/utils/require-current-user'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function DeleteClassPage({ params }: Props) {
	const { locale, id } = await params
	const currentUser = await requireCurrentUser()

	const data = await getSeriesWithSessionsById(id)
	if (!data) notFound()

	async function deleteAction() {
		'use server'
		await deleteSeries(currentUser.id, id)
		revalidatePath(`/${locale}/classes`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Delete {data.series.title}</h1>
				<p className="text-sm text-muted-foreground">
					This permanently deletes the series and all parts.
				</p>
			</div>

			<Card>
				<CardContent className="space-y-4">
					<form action={deleteAction}>
						<Button variant="destructive" className="w-full" type="submit">
							Delete
						</Button>
					</form>

					<Button variant="secondary" className="w-full" asChild>
						<Link href={`/${locale}/classes/update/${id}`}>Cancel</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
