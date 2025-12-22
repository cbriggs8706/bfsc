// app/[locale]/(consultants)/classes/create/page.tsx
import { revalidatePath } from 'next/cache'
import { ClassSeriesForm } from '@/components/classes/ClassSeriesForm'
import { Card, CardContent } from '@/components/ui/card'
import { insertSeries, listPresenterOptions } from '@/db/queries/classes'

// ✅ replace this with your real session getter
import { requireCurrentUser } from '@/utils/require-current-user'
import { getClassesRequireApproval } from '@/utils/site-settings'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CreateClassPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

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
				<h1 className="text-3xl font-bold">{t('classes.create')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('classes.createSub')}
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
