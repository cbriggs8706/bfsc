// db/queries/library.ts
import { db } from '@/db'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import {
	libraryItems,
	libraryCopies,
	libraryLoans,
} from '@/db/schema/tables/library'
import { LibraryItemFormInput } from '@/components/library/LibraryItemForm'
import { LibraryQueryParams } from '@/types/library'

export type UpdateLibraryItemInput = LibraryItemFormInput

export async function listLibraryItems({
	q,
	tag,
	type,
	sort = 'name',
	dir = 'asc',
	page = 1,
	pageSize = 25,
}: LibraryQueryParams) {
	const offset = (page - 1) * pageSize

	const where = and(
		type ? eq(libraryItems.type, type) : undefined,

		q
			? or(
					ilike(libraryItems.name, `%${q}%`),
					sql`exists (
					select 1
					from unnest(${libraryItems.tags}) t
					where t ilike ${'%' + q + '%'}
				)`
			  )
			: undefined,

		tag ? sql`${libraryItems.tags} @> ARRAY[${tag}]::text[]` : undefined
	)

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(libraryItems)
		.where(where)

	const orderBy =
		sort === 'createdAt'
			? dir === 'asc'
				? libraryItems.createdAt
				: desc(libraryItems.createdAt)
			: dir === 'asc'
			? libraryItems.name
			: desc(libraryItems.name)

	const rows = await db
		.select({
			id: libraryItems.id,
			name: libraryItems.name,
			type: libraryItems.type,
			authorManufacturer: libraryItems.authorManufacturer,
			tags: libraryItems.tags,
		})
		.from(libraryItems)
		.where(where)
		.orderBy(orderBy)
		.limit(pageSize)
		.offset(offset)

	const copyRows = await db
		.select({
			itemId: libraryCopies.itemId,
			status: libraryCopies.status,
		})
		.from(libraryCopies)

	const counts = new Map<
		string,
		{ total: number; available: number; checkedOut: number }
	>()

	for (const c of copyRows) {
		if (!counts.has(c.itemId)) {
			counts.set(c.itemId, { total: 0, available: 0, checkedOut: 0 })
		}
		const entry = counts.get(c.itemId)!
		entry.total++
		if (c.status === 'available') entry.available++
		if (c.status === 'checked_out') entry.checkedOut++
	}

	const items = rows.map((item) => ({
		...item,
		counts: counts.get(item.id) ?? {
			total: 0,
			available: 0,
			checkedOut: 0,
		},
	}))

	return {
		items,
		total: count,
	}
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
		tags: item.tags ?? [],
		copyCodes: copies.map((c) => c.copyCode),
	}
}

export async function updateLibraryItem(
	userId: string,
	id: string,
	input: UpdateLibraryItemInput
) {
	await db.transaction(async (tx) => {
		// 1️⃣ Update item metadata
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
				tags: input.tags,
			})
			.where(eq(libraryItems.id, id))

		// 2️⃣ Fetch existing copies
		const existingCopies = await tx
			.select({
				id: libraryCopies.id,
				copyCode: libraryCopies.copyCode,
			})
			.from(libraryCopies)
			.where(eq(libraryCopies.itemId, id))

		const existingCodes = new Set(existingCopies.map((c) => c.copyCode))
		const incomingCodes = new Set(input.copyCodes)

		// 3️⃣ Insert NEW copies only
		for (const code of input.copyCodes) {
			if (!existingCodes.has(code)) {
				await tx.insert(libraryCopies).values({
					itemId: id,
					copyCode: code,
					status: 'available',
				})
			}
		}

		// 4️⃣ Remove copies ONLY if they have never been loaned
		for (const copy of existingCopies) {
			if (!incomingCodes.has(copy.copyCode)) {
				const [{ count }] = await tx
					.select({ count: sql<number>`count(*)` })
					.from(libraryLoans)
					.where(eq(libraryLoans.copyId, copy.id))

				if (count > 0) {
					throw new Error(
						`Copy "${copy.copyCode}" cannot be removed because it has loan history.`
					)
				}

				await tx.delete(libraryCopies).where(eq(libraryCopies.id, copy.id))
			}
		}
	})
}

export async function deleteLibraryItem(userId: string, id: string) {
	await db.transaction(async (tx) => {
		await tx.delete(libraryCopies).where(eq(libraryCopies.itemId, id))

		await tx.delete(libraryItems).where(eq(libraryItems.id, id))
	})
}
