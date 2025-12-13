// app/[locale]/(app)/classes/create/page.tsx
import { revalidatePath } from 'next/cache'
import { ClassSeriesForm } from '@/components/classes/ClassSeriesForm'
import { Card, CardContent } from '@/components/ui/card'
import { insertSeries, listPresenterOptions } from '@/db/queries/classes'

// ✅ replace this with your real session getter
import { requireCurrentUser } from '@/utils/require-current-user'
import { getClassesRequireApproval } from '@/utils/site-settings'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CreateClassPage({ params }: Props) {
	const { locale } = await params

	const currentUser = await requireCurrentUser()
	const presenterOptions = await listPresenterOptions()
	const requireApproval = await getClassesRequireApproval()

	async function createAction(input: Parameters<typeof insertSeries>[1]) {
		'use server'
		const id = await insertSeries(currentUser.id, input, { requireApproval })
		revalidatePath(`/${locale}/classes`)
		revalidatePath(`/${locale}/classes/update/${id}`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Create Class</h1>
				<p className="text-sm text-muted-foreground">
					Create a one-time class or a multi-part series.
				</p>
			</div>

			<Card>
				<CardContent>
					<ClassSeriesForm
						mode="create"
						locale={locale}
						requireApproval={requireApproval}
						canApprove={currentUser.role === 'Admin'}
						presenterOptions={presenterOptions}
						onSubmit={createAction}
						onDoneHref={`/${locale}/classes`}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
