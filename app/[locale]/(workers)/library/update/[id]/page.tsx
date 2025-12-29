// app/[locale]/(workers)/library/update/[id]/page.tsx
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import { readLibraryItem } from '@/lib/actions/library/library'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function UpdateLibraryItemPage({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const item = await readLibraryItem(id)
	if (!item) notFound()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('update')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('library.updateSub')}
				</p>
			</div>

			<LibraryItemForm
				locale={locale}
				mode="update"
				itemId={id}
				initialValues={item}
			/>
		</div>
	)
}
