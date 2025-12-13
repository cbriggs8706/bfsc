// db/schema/cases.ts
import {
	pgTable,
	uuid,
	text,
	timestamp,
	pgEnum,
	boolean,
	primaryKey,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { relations } from 'drizzle-orm'

export const caseStatusEnum = pgEnum('case_status', [
	'open',
	'investigating',
	'waiting',
	'solved',
	'archived',
])

export const cases = pgTable('cases', {
	id: uuid('id').defaultRandom().primaryKey(),

	title: text('title').notNull(),
	description: text('description').notNull(),

	status: caseStatusEnum('status').default('open').notNull(),

	typeId: uuid('type_id')
		.references(() => caseTypes.id)
		.notNull(),

	createdByUserId: uuid('created_by_user_id')
		.references(() => user.id)
		.notNull(),

	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),

	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),

	solvedAt: timestamp('solved_at', { withTimezone: true }),
	archivedAt: timestamp('archived_at', { withTimezone: true }),
})

export const caseTypes = pgTable('case_types', {
	id: uuid('id').defaultRandom().primaryKey(),

	name: text('name').notNull(), // "Photo Identification"
	icon: text('icon'), // lucide name or emoji
	color: text('color'), // optional accent (tailwind token)

	isActive: boolean('is_active').default(true).notNull(),

	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const caseComments = pgTable('case_comments', {
	id: uuid('id').defaultRandom().primaryKey(),

	caseId: uuid('case_id')
		.references(() => cases.id, { onDelete: 'cascade' })
		.notNull(),

	authorUserId: uuid('author_user_id')
		.references(() => user.id)
		.notNull(),

	body: text('body').notNull(),

	replyToCommentId: uuid('reply_to_comment_id'), // ⬅ no reference yet

	editedAt: timestamp('edited_at', { withTimezone: true }),

	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const caseCommentsRelations = relations(caseComments, ({ one }) => ({
	replyTo: one(caseComments, {
		fields: [caseComments.replyToCommentId],
		references: [caseComments.id],
	}),
}))

export const caseAttachments = pgTable('case_attachments', {
	id: uuid('id').defaultRandom().primaryKey(),

	caseId: uuid('case_id')
		.references(() => cases.id, { onDelete: 'cascade' })
		.notNull(),

	uploadedByUserId: uuid('uploaded_by_user_id')
		.references(() => user.id)
		.notNull(),

	fileUrl: text('file_url').notNull(),
	fileType: text('file_type').notNull(),

	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const caseWatchers = pgTable(
	'case_watchers',
	{
		caseId: uuid('case_id')
			.references(() => cases.id, { onDelete: 'cascade' })
			.notNull(),

		userId: uuid('user_id')
			.references(() => user.id)
			.notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.caseId, table.userId] }),
	})
)

export const commentMentions = pgTable('comment_mentions', {
	id: uuid('id').defaultRandom().primaryKey(),

	commentId: uuid('comment_id')
		.references(() => caseComments.id, { onDelete: 'cascade' })
		.notNull(),

	caseId: uuid('case_id')
		.references(() => cases.id, { onDelete: 'cascade' })
		.notNull(),

	mentionedUserId: uuid('mentioned_user_id')
		.references(() => user.id, { onDelete: 'cascade' })
		.notNull(),

	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),

	readAt: timestamp('read_at', { withTimezone: true }), // null = unread
})
