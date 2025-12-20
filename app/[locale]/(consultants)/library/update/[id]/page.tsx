// app/[locale]/(consultants)/library/update/[id]/page.tsx

import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { LibraryItemForm } from '@/components/library/LibraryItemForm'
import {
	getLibraryItemById,
	updateLibraryItem,
	UpdateLibraryItemInput,
} from '@/db/queries/library'
import { requireCurrentUser } from '@/utils/require-current-user'

interface Props {
	params: Promise<{ locale: string; id: string }>
}

export default async function UpdateLibraryItemPage({ params }: Props) {
	const { locale, id } = await params

	const currentUser = await requireCurrentUser()

	const data = await getLibraryItemById(id)
	if (!data) notFound()

	async function updateAction(input: UpdateLibraryItemInput) {
		'use server'
		await updateLibraryItem(currentUser.id, id, input)
		revalidatePath(`/${locale}/library`)
		revalidatePath(`/${locale}/library/update/${id}`)
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Update {data.name}</h1>
				<p className="text-sm text-muted-foreground">
					Changes are not saved until you click Save below.
				</p>
			</div>

			<Card>
				<CardContent>
					<LibraryItemForm
						mode="update"
						locale={locale}
						initial={data}
						onSubmit={updateAction}
						onDoneHref={`/${locale}/library`}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
