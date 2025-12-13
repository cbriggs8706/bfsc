// app/[locale]/(app)/classes/update/[id]/page.tsx
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ClassSeriesForm } from '@/components/classes/ClassSeriesForm'
import { Card, CardContent } from '@/components/ui/card'
import { getSeriesWithSessionsById, updateSeries } from '@/db/queries/classes'
import { requireCurrentUser } from '@/utils/require-current-user'
import { getClassesRequireApproval } from '@/utils/site-settings'
import { listPresenterOptions } from '@/db/queries/classes'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function UpdateClassPage({ params }: Props) {
	const { locale, id } = await params

	const currentUser = await requireCurrentUser()
	const presenterOptions = await listPresenterOptions()
	const requireApproval = await getClassesRequireApproval()

	const data = await getSeriesWithSessionsById(id)
	if (!data) notFound()

	async function updateAction(input: Parameters<typeof updateSeries>[2]) {
		'use server'
		await updateSeries(currentUser.id, id, input, {
			canApprove: currentUser.role === 'Admin',
		})
		revalidatePath(`/${locale}/classes`)
		revalidatePath(`/${locale}/classes/update/${id}`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Update {data.series.title}</h1>
				<p className="text-sm text-muted-foreground">
					Changes are not saved until you click Save below.
				</p>
			</div>

			<Card>
				<CardContent>
					<ClassSeriesForm
						mode="update"
						locale={locale}
						requireApproval={requireApproval}
						canApprove={currentUser.role === 'Admin'}
						presenterOptions={presenterOptions}
						initial={data}
						onSubmit={updateAction}
						onDoneHref={`/${locale}/classes`}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
