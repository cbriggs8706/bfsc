import { revalidatePath } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import { requireCurrentUser } from '@/utils/require-current-user'
import { createLibraryItem } from '@/app/actions/library/create-library-item'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function CreateLibraryItemPage({ params }: Props) {
	const { locale } = await params
	const currentUser = await requireCurrentUser()

	async function createAction(input: Parameters<typeof createLibraryItem>[1]) {
		'use server'
		await createLibraryItem(currentUser.id, input)
		revalidatePath(`/${locale}/library`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Add Library Item</h1>
				<p className="text-sm text-muted-foreground">
					Add a book or piece of equipment to inventory.
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
