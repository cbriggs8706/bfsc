// app/[locale]/(consultants)/library/page.tsx
import { LibraryItemsTable } from '@/components/library/LibraryItemsTable'
import { requireCurrentUser } from '@/utils/require-current-user'
import { LibraryFilters } from '@/components/library/LibraryFilters'
import { LibraryFilterDrawer } from '@/components/library/LibraryFilterDrawer'
import { listLibraryItems } from '@/db/queries/library'
import { LibraryPagination } from '@/components/library/LibraryPagination'
import { getTranslations } from 'next-intl/server'

interface Props {
	params: Promise<{ locale: string }>
	searchParams: Promise<{
		q?: string
		type?: 'book' | 'equipment'
		tag?: string
		page?: string
	}>
}

export default async function LibraryPage({ params, searchParams }: Props) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const sp = await searchParams

	let currentUser = null
	try {
		currentUser = await requireCurrentUser(locale)
	} catch {
		// public allowed
	}

	const PAGE_SIZE = 25

	const { items, total } = await listLibraryItems({
		q: sp.q,
		type: sp.type,
		tag: sp.tag,
		page: sp.page ? Number(sp.page) : 1,
	})

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t('library.inventory')}</h1>
					<p className="text-sm text-muted-foreground">{t('library.sub')}</p>
				</div>
			</div>

			{/* Desktop filters */}
			<div className="hidden md:block">
				<LibraryFilters />
			</div>

			{/* Mobile filters */}
			<LibraryFilterDrawer />

			<LibraryItemsTable
				items={items}
				locale={locale}
				currentUser={currentUser}
			/>
			<LibraryPagination
				page={sp.page ? Number(sp.page) : 1}
				pageSize={PAGE_SIZE}
				total={total}
			/>
		</div>
	)
}
