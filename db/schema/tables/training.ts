// db/schema/tables/training.ts
import {
	pgTable,
	uuid,
	text,
	integer,
	boolean,
	timestamp,
	index,
	unique,
	jsonb,
	primaryKey,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

// ---------- COURSES ----------
export const learningCourses = pgTable(
	'learning_courses',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Friendly URLs: /learn/courses/memories-level-1
		slug: text('slug').notNull(),

		title: text('title').notNull(), // "Memories: Level 1"
		description: text('description'),
		category: text('category'), // "Memories", "Research", etc.
		level: integer('level'), // 1,2,3...
		isPublished: boolean('is_published').notNull().default(true),
		contentVersion: integer('content_version').notNull().default(1),

		// Optional image for the course card (supabase path/url)
		badgeImagePath: text('badge_image_path'),
		badgeIconName: text('badge_icon_name'),

		sortOrder: integer('sort_order').notNull().default(0),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique('learning_courses_slug_unique').on(t.slug),
		index('learning_courses_published_idx').on(t.isPublished),
		index('learning_courses_category_level_idx').on(t.category, t.level),
	]
)

// ---------- UNITS ----------
export const learningUnits = pgTable(
	'learning_units',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		courseId: uuid('course_id')
			.notNull()
			.references(() => learningCourses.id, { onDelete: 'cascade' }),

		title: text('title').notNull(),
		description: text('description'),
		sortOrder: integer('sort_order').notNull().default(0),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('learning_units_course_idx').on(t.courseId)]
)

// ---------- LESSONS ----------
export const learningLessons = pgTable(
	'learning_lessons',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		unitId: uuid('unit_id')
			.notNull()
			.references(() => learningUnits.id, { onDelete: 'cascade' }),

		title: text('title').notNull(),
		summary: text('summary'),
		sortOrder: integer('sort_order').notNull().default(0),

		// If you want to hide lessons until ready
		isPublished: boolean('is_published').notNull().default(true),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('learning_lessons_unit_idx').on(t.unitId)]
)

// ---------- LESSON CONTENT BLOCKS ----------
// One flexible table covers text, images, and external links (including Google Forms quizzes).
export const learningLessonBlocks = pgTable(
	'learning_lesson_blocks',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => learningLessons.id, { onDelete: 'cascade' }),

		sortOrder: integer('sort_order').notNull().default(0),

		// "text" | "image" | "link"
		type: text('type').$type<'text' | 'image' | 'link'>().notNull(),

		// For "text": { title?, bodyMarkdown }
		// For "image": { path, alt?, caption? }  (path = supabase storage path)
		// For "link": { url, label?, kind? }     (kind could be "quiz" | "resource")
		data: jsonb('data').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('learning_blocks_lesson_idx').on(t.lessonId)]
)

// ---------- USER LESSON COMPLETIONS ----------
export const learningLessonCompletions = pgTable(
	'learning_lesson_completions',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => learningLessons.id, { onDelete: 'cascade' }),

		completedAt: timestamp('completed_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		primaryKey({
			columns: [t.userId, t.lessonId],
			name: 'learning_lesson_completions_pk',
		}),
		index('learning_lesson_completions_user_idx').on(t.userId),
		index('learning_lesson_completions_lesson_idx').on(t.lessonId),
	]
)

// ---------- USER COURSE COMPLETIONS ----------
export const learningCourseCompletions = pgTable(
	'learning_course_completions',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		courseId: uuid('course_id')
			.notNull()
			.references(() => learningCourses.id, { onDelete: 'cascade' }),

		completedAt: timestamp('completed_at', { withTimezone: true })
			.notNull()
			.defaultNow(),

		// If you want to store the issued certificate row id
		certificateId: uuid('certificate_id'),
	},
	(t) => [
		primaryKey({
			columns: [t.userId, t.courseId],
			name: 'learning_course_completions_pk',
		}),
		index('learning_course_completions_user_idx').on(t.userId),
		index('learning_course_completions_course_idx').on(t.courseId),
	]
)

// ---------- CERTIFICATES (INTERNAL + EXTERNAL) ----------
export const userCertificates = pgTable(
	'user_certificates',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		// "internal" (from your courses) or "external" (synced later)
		source: text('source').$type<'internal' | 'external'>().notNull(),

		// For internal: points to courseId
		courseId: uuid('course_id').references(() => learningCourses.id, {
			onDelete: 'set null',
		}),
		courseVersion: integer('course_version'),

		// For external: stable identifier from the other site
		externalProvider: text('external_provider'),
		externalCertificateId: text('external_certificate_id'),
		externalCertificateVersion: text('external_certificate_version'),

		title: text('title').notNull(), // shown on UI
		category: text('category'),
		level: integer('level'),

		issuedAt: timestamp('issued_at', { withTimezone: true })
			.notNull()
			.defaultNow(),

		// Optional verification link (external) or a public page on your site
		verifyUrl: text('verify_url'),

		// Optional metadata (JSON for badges, logos, etc.)
		meta: jsonb('meta'),
	},
	(t) => [
		index('user_certificates_user_idx').on(t.userId),
		index('user_certificates_source_idx').on(t.source),
		unique('user_certificates_external_unique').on(
			t.externalProvider,
			t.externalCertificateId
		),
	]
)
