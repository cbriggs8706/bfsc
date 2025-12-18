// db/schema/tables/newsletters.ts
import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	index,
	jsonb,
	unique,
} from 'drizzle-orm/pg-core'

export const newsletterPosts = pgTable(
	'newsletter_posts',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		slug: text('slug').notNull().unique(),

		status: text('status')
			.$type<'draft' | 'published'>()
			.notNull()
			.default('draft'),

		featured: boolean('featured').notNull().default(false),

		// Optional manual ordering for pinned posts
		featuredOrder: text('featured_order'),

		coverImageUrl: text('cover_image_url'),

		publishedAt: timestamp('published_at'),

		authorId: uuid('author_id').notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => ({
		slugIdx: index('newsletter_slug_idx').on(t.slug),
		publishedIdx: index('newsletter_published_idx').on(t.publishedAt),
		featuredIdx: index('newsletter_featured_idx').on(t.featured),
	})
)

export const newsletterTranslations = pgTable(
	'newsletter_translations',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		postId: uuid('post_id')
			.notNull()
			.references(() => newsletterPosts.id, {
				onDelete: 'cascade',
			}),

		locale: text('locale').notNull(),

		title: text('title').notNull(),
		excerpt: text('excerpt'),
		content: text('content').notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => ({
		postLocaleUnique: unique('newsletter_post_locale_unique').on(
			t.postId,
			t.locale
		),
	})
)

export const newsletterTags = pgTable('newsletter_tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull(),
})

export const newsletterPostTags = pgTable(
	'newsletter_post_tags',
	{
		postId: uuid('post_id')
			.references(() => newsletterPosts.id, { onDelete: 'cascade' })
			.notNull(),

		tagId: uuid('tag_id')
			.references(() => newsletterTags.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(t) => ({
		pk: [t.postId, t.tagId],
	})
)

export const newsletterCategories = pgTable('newsletter_categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull(),
})

export const newsletterPostCategories = pgTable(
	'newsletter_post_categories',
	{
		postId: uuid('post_id')
			.references(() => newsletterPosts.id, { onDelete: 'cascade' })
			.notNull(),

		categoryId: uuid('category_id')
			.references(() => newsletterCategories.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(t) => ({
		pk: [t.postId, t.categoryId],
	})
)

export const newsletterSubscribers = pgTable(
	'newsletter_subscribers',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		email: text('email').notNull(),

		// double opt-in
		isConfirmed: boolean('is_confirmed').notNull().default(false),
		confirmedAt: timestamp('confirmed_at', { withTimezone: true }),

		// confirmation flow
		confirmToken: text('confirm_token').notNull(),

		// optional unsubscribe support
		unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),

		source: text('source'), // 'homepage', 'event', 'manual', etc.

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('newsletter_email_unique').on(table.email)]
)
