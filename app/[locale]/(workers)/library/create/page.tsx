// app/[locale]/(workers)/library/create/page.tsx
import { revalidatePath } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import { requireCurrentUser } from '@/utils/require-current-user'
import { createLibraryItem } from '@/app/actions/library/create-library-item'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CreateLibraryItemPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const currentUser = await requireCurrentUser(locale)

	async function createAction(input: Parameters<typeof createLibraryItem>[1]) {
		'use server'
		await createLibraryItem(currentUser.id, input)
		revalidatePath(`/${locale}/library`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('library.create')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('library.createSub')}
				</p>
			</div>

			<Card>
				<CardContent>
					<LibraryItemForm
						mode="create"
						locale={locale}
						onSubmit={createAction}
						onDoneHref={`/${locale}/library`}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
