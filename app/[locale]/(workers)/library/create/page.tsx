// app/[locale]/(workers)/library/create/page.tsx
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CreateLibraryItemPage({ params }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('library.create')}</h1>
				<p className="text-sm text-muted-foreground">
					{t('library.createSub')}
				</p>
			</div>
			<LibraryItemForm locale={locale} />
		</div>
	)
}
