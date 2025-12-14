// db/schema/tables/library.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	integer,
	timestamp,
	pgEnum,
	uniqueIndex,
	index,
} from 'drizzle-orm/pg-core'
import { user } from '@/db/schema/tables/auth' // adjust path if needed

export const libraryItemType = pgEnum('library_item_type', [
	'book',
	'equipment',
])

export const libraryCopyStatus = pgEnum('library_copy_status', [
	'available',
	'checked_out',
	'retired',
	'lost',
])

export const libraryItems = pgTable(
	'library_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		type: libraryItemType('type').notNull(),

		name: varchar('name', { length: 256 }).notNull(),
		description: text('description').notNull(),

		year: integer('year'),
		authorManufacturer: varchar('author_manufacturer', { length: 256 }),

		isbn: varchar('isbn', { length: 32 }),
		notes: text('notes'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => ({
		typeIdx: index('library_items_type_idx').on(t.type),
		nameIdx: index('library_items_name_idx').on(t.name),
		isbnIdx: index('library_items_isbn_idx').on(t.isbn),
	})
)

export const libraryCopies = pgTable(
	'library_copies',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		itemId: uuid('item_id')
			.notNull()
			.references(() => libraryItems.id, { onDelete: 'cascade' }),

		// barcode/label for scanning at kiosk
		copyCode: varchar('copy_code', { length: 64 }).notNull(),

		modelNumber: varchar('model_number', { length: 64 }),

		status: libraryCopyStatus('status').default('available').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => ({
		copyCodeUq: uniqueIndex('library_copies_copy_code_uq').on(t.copyCode),
		itemIdx: index('library_copies_item_id_idx').on(t.itemId),
		statusIdx: index('library_copies_status_idx').on(t.status),
	})
)

export const libraryLoans = pgTable(
	'library_loans',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		copyId: uuid('copy_id')
			.notNull()
			.references(() => libraryCopies.id, { onDelete: 'restrict' }),

		// Borrower can be an internal user OR a guest record:
		borrowerUserId: uuid('borrower_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		borrowerName: varchar('borrower_name', { length: 256 }),
		borrowerEmail: varchar('borrower_email', { length: 256 }),
		borrowerPhone: varchar('borrower_phone', { length: 32 }),

		checkedOutAt: timestamp('checked_out_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		returnedAt: timestamp('returned_at', { withTimezone: true }),

		checkedOutByUserId: uuid('checked_out_by_user_id').references(
			() => user.id,
			{
				onDelete: 'set null',
			}
		),
		returnedByUserId: uuid('returned_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
	},
	(t) => ({
		copyIdx: index('library_loans_copy_id_idx').on(t.copyId),
		activeByCopyIdx: index('library_loans_active_by_copy_idx').on(
			t.copyId,
			t.returnedAt
		),
		borrowerUserIdx: index('library_loans_borrower_user_idx').on(
			t.borrowerUserId
		),
	})
)
