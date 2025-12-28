// app/[locale]/(workers)/library/delete/[id]/page.tsx
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import { readLibraryItem } from '@/lib/actions/library/library-actions'
import { requireCurrentUser } from '@/utils/require-current-user'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function DeleteLibraryItemPage({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })
	const currentUser = await requireCurrentUser(locale)

	const item = await readLibraryItem(id)
	if (!item) notFound()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold text-destructive">
					{t('delete')} {item.name}
				</h1>
				<p className="text-sm text-muted-foreground">{t('deleteSub')}</p>
			</div>

			<LibraryItemForm
				userId={currentUser.id}
				locale={locale}
				mode="delete"
				itemId={id}
				initialValues={item}
			/>
		</div>
	)
}
