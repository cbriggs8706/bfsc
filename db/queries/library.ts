// db/queries/library.ts
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { libraryItems, libraryCopies } from '@/db/schema/tables/library'
import { LibraryItemFormInput } from '@/components/library/LibraryItemForm'

export type UpdateLibraryItemInput = {
	type: 'book' | 'equipment'
	name: string
	description: string
	year?: number
	authorManufacturer?: string
	isbn?: string
	notes?: string
	copyCodes: string[]
}

export async function listLibraryItemsForTable() {
	const items = await db
		.select({
			id: libraryItems.id,
			name: libraryItems.name,
			type: libraryItems.type,
			authorManufacturer: libraryItems.authorManufacturer,
		})
		.from(libraryItems)
		.orderBy(libraryItems.name)

	const copies = await db
		.select({
			itemId: libraryCopies.itemId,
			status: libraryCopies.status,
		})
		.from(libraryCopies)

	const counts = new Map<
		string,
		{ total: number; available: number; checkedOut: number }
	>()

	for (const c of copies) {
		if (!counts.has(c.itemId)) {
			counts.set(c.itemId, { total: 0, available: 0, checkedOut: 0 })
		}
		const entry = counts.get(c.itemId)!
		entry.total++
		if (c.status === 'available') entry.available++
		if (c.status === 'checked_out') entry.checkedOut++
	}

	return items.map((item) => ({
		...item,
		counts: counts.get(item.id) ?? {
			total: 0,
			available: 0,
			checkedOut: 0,
		},
	}))
}

export async function getLibraryItemById(
	id: string
): Promise<(LibraryItemFormInput & { id: string }) | null> {
	const item = await db.query.libraryItems.findFirst({
		where: (t, { eq }) => eq(t.id, id),
	})

	if (!item) return null

	const copies = await db
		.select({ copyCode: libraryCopies.copyCode })
		.from(libraryCopies)
		.where(eq(libraryCopies.itemId, id))

	return {
		id: item.id,
		type: item.type,
		name: item.name,
		description: item.description,

		// 🔑 normalize null → undefined
		year: item.year ?? undefined,
		authorManufacturer: item.authorManufacturer ?? undefined,
		isbn: item.isbn ?? undefined,
		notes: item.notes ?? undefined,

		copyCodes: copies.map((c) => c.copyCode),
	}
}

export async function updateLibraryItem(
	userId: string,
	id: string,
	input: UpdateLibraryItemInput
) {
	await db.transaction(async (tx) => {
		await tx
			.update(libraryItems)
			.set({
				type: input.type,
				name: input.name,
				description: input.description,
				year: input.year,
				authorManufacturer: input.authorManufacturer,
				isbn: input.isbn,
				notes: input.notes,
			})
			.where(eq(libraryItems.id, id))

		// Replace copies
		await tx.delete(libraryCopies).where(eq(libraryCopies.itemId, id))

		for (const code of input.copyCodes) {
			await tx.insert(libraryCopies).values({
				itemId: id,
				copyCode: code,
				status: 'available',
			})
		}
	})
}

export async function deleteLibraryItem(userId: string, id: string) {
	await db.transaction(async (tx) => {
		await tx.delete(libraryCopies).where(eq(libraryCopies.itemId, id))

		await tx.delete(libraryItems).where(eq(libraryItems.id, id))
	})
}
