// app/[locale]/(app)/library/page.tsx
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listLibraryItemsForTable } from '@/db/queries/library'
import { LibraryItemsTable } from '@/components/library/LibraryItemsTable'
import { requireCurrentUser } from '@/utils/require-current-user'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function LibraryPage({ params }: Props) {
	const { locale } = await params

	let currentUser = null
	try {
		currentUser = await requireCurrentUser()
	} catch {
		// public view allowed
	}

	const items = await listLibraryItemsForTable()

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Library Inventory</h1>
					<p className="text-sm text-muted-foreground">
						Books and equipment available at the center
					</p>
				</div>

				{/* {currentUser?.role === 'Admin' && (
					<Button asChild>
						<Link href={`/${locale}/library/create`}>Add Item</Link>
					</Button>
				)} */}
			</div>

			<Card>
				<CardContent>
					<LibraryItemsTable
						items={items}
						currentUser={currentUser}
						locale={locale}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
