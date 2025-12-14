'use server'

import { db } from '@/db'
import { libraryItems, libraryCopies } from '@/db/schema/tables/library'

export async function createLibraryItem(
	userId: string,
	input: {
		type: 'book' | 'equipment'
		name: string
		description: string
		year?: number
		authorManufacturer?: string
		isbn?: string
		notes?: string
		copyCodes: string[]
		tags: string[]
	}
) {
	if (input.copyCodes.length === 0) {
		throw new Error('At least one copy code is required')
	}

	await db.transaction(async (tx) => {
		const [item] = await tx
			.insert(libraryItems)
			.values({
				type: input.type,
				name: input.name,
				description: input.description,
				year: input.year,
				authorManufacturer: input.authorManufacturer,
				isbn: input.isbn,
				notes: input.notes,
				tags: input.tags,
			})
			.returning({ id: libraryItems.id })

		for (const code of input.copyCodes) {
			await tx.insert(libraryCopies).values({
				itemId: item.id,
				copyCode: code,
				status: 'available',
			})
		}
	})
}
