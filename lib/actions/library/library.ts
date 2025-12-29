// lib/actions/library/library.ts
'use server'

import { db } from '@/db'
import { and, eq, ilike, inArray, sql, count } from 'drizzle-orm'
import { libraryItems, libraryCopies } from '@/db/schema/tables/library'

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type DbErrorCause = {
	code?: string
}

export type LibraryItemInput = {
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

export type LibraryActionResult =
	| { ok: true }
	| { ok: false; fieldErrors?: { copyCodesText?: true } }

/* ------------------------------------------------------------------ */
/* READ */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* READ (FORM-SHAPED) */
/* ------------------------------------------------------------------ */

export async function readLibraryItem(itemId: string) {
	const item = await db.query.libraryItems.findFirst({
		where: eq(libraryItems.id, itemId),
		with: {
			copies: true,
		},
	})

	if (!item) return null

	// Normalize DB → form shape HERE
	return {
		type: item.type,
		name: item.name,
		description: item.description,

		copyCodesText: (item.copies as { copyCode: string }[])
			.map((c) => c.copyCode)
			.join('\n'),

		year: item.year ? String(item.year) : '',
		authorManufacturer: item.authorManufacturer ?? '',
		isbn: item.isbn ?? '',
		notes: item.notes ?? '',
		tagsText: item.tags.join('\n'),
	}
}

/* ------------------------------------------------------------------ */
/* READ ALL (for tables / lists) */
/* ------------------------------------------------------------------ */

export async function readAllLibraryItems(filters?: {
	q?: string
	type?: 'book' | 'equipment'
	tag?: string
	page?: number
	pageSize?: number
}) {
	const page = filters?.page ?? 1
	const pageSize = filters?.pageSize ?? 25

	const where = []

	if (filters?.type) {
		where.push(eq(libraryItems.type, filters.type))
	}

	if (filters?.tag) {
		where.push(sql`${libraryItems.tags} @> ARRAY[${filters.tag}]::text[]`)
	}

	if (filters?.q) {
		where.push(ilike(libraryItems.name, `%${filters.q}%`))
	}

	const items = await db
		.select({
			id: libraryItems.id,
			name: libraryItems.name,
			type: libraryItems.type,
			authorManufacturer: libraryItems.authorManufacturer,
			tags: libraryItems.tags,

			// 🔢 inventory counts
			total: db.$count(
				libraryCopies,
				eq(libraryCopies.itemId, libraryItems.id)
			),
			available: db.$count(
				libraryCopies,
				and(
					eq(libraryCopies.itemId, libraryItems.id),
					eq(libraryCopies.status, 'available')
				)
			),
			checkedOut: db.$count(
				libraryCopies,
				and(
					eq(libraryCopies.itemId, libraryItems.id),
					eq(libraryCopies.status, 'checked_out')
				)
			),
		})
		.from(libraryItems)
		.where(and(...where))
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	const [{ count: total }] = await db
		.select({ count: count() })
		.from(libraryItems)
		.where(and(...where))

	// 🔁 Shape rows exactly like LibraryItemRow
	return {
		items: items.map((i) => ({
			id: i.id,
			name: i.name,
			type: i.type,
			authorManufacturer: i.authorManufacturer,
			tags: i.tags,
			counts: {
				total: Number(i.total),
				available: Number(i.available),
				checkedOut: Number(i.checkedOut),
			},
		})),
		total: Number(total),
	}
}

/* ------------------------------------------------------------------ */
/* CREATE */
/* ------------------------------------------------------------------ */

export async function createLibraryItem(
	input: LibraryItemInput
): Promise<LibraryActionResult & { id?: string }> {
	try {
		const id = await db.transaction(async (tx) => {
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

			return item.id
		})

		return { ok: true, id }
	} catch (err: unknown) {
		const cause = (err as { cause?: DbErrorCause })?.cause
		if (cause?.code === '23505') {
			return { ok: false, fieldErrors: { copyCodesText: true } }
		}
		throw err
	}
}

/* ------------------------------------------------------------------ */
/* UPDATE */
/* ------------------------------------------------------------------ */

export async function updateLibraryItem(
	itemId: string,
	input: LibraryItemInput
): Promise<LibraryActionResult> {
	try {
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
					tags: input.tags,
				})
				.where(eq(libraryItems.id, itemId))

			// Existing copy codes
			const existing = await tx
				.select({ code: libraryCopies.copyCode })
				.from(libraryCopies)
				.where(eq(libraryCopies.itemId, itemId))

			const existingCodes = new Set(existing.map((c) => c.code))
			const incomingCodes = new Set(input.copyCodes)

			// Remove deleted codes
			const toDelete = [...existingCodes].filter(
				(code) => !incomingCodes.has(code)
			)

			if (toDelete.length > 0) {
				await tx
					.delete(libraryCopies)
					.where(inArray(libraryCopies.copyCode, toDelete))
			}

			// Insert new codes
			for (const code of input.copyCodes) {
				if (!existingCodes.has(code)) {
					await tx.insert(libraryCopies).values({
						itemId,
						copyCode: code,
						status: 'available',
					})
				}
			}
		})

		return { ok: true }
	} catch (err: unknown) {
		const cause = (err as { cause?: DbErrorCause })?.cause
		if (cause?.code === '23505') {
			return { ok: false, fieldErrors: { copyCodesText: true } }
		}
		throw err
	}
}

/* ------------------------------------------------------------------ */
/* DELETE */
/* ------------------------------------------------------------------ */

export async function deleteLibraryItem(itemId: string): Promise<{ ok: true }> {
	await db.transaction(async (tx) => {
		await tx.delete(libraryCopies).where(eq(libraryCopies.itemId, itemId))

		await tx.delete(libraryItems).where(eq(libraryItems.id, itemId))
	})

	return { ok: true }
}
