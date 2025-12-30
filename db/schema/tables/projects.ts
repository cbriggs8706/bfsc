import {
	pgTable,
	uuid,
	text,
	integer,
	timestamp,
	index,
	primaryKey,
	boolean,
	pgEnum,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

export const difficultyEnum = pgEnum('difficulty', [
	'easy',
	'medium',
	'difficult',
])

/* ------------------------------------------------------------------
   PROJECTS
------------------------------------------------------------------ */
export const projects = pgTable(
	'projects',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		name: text('name').notNull(),
		instructions: text('instructions'),
		difficulty: difficultyEnum('difficulty').notNull().default('easy'),
		// ---- S.M.A.R.T. goal fields ----
		specific: text('specific'), // S
		measurable: text('measurable'), // M
		achievable: text('achievable'), // A
		relevant: text('relevant'), // R

		// T = target / goal date
		targetDate: timestamp('target_date', { withTimezone: true }),

		// Filled in manually when finished
		actualCompletionDate: timestamp('actual_completion_date', {
			withTimezone: true,
		}),
		sortOrder: integer('sort_order').notNull().default(0),
		createdByUserId: uuid('created_by_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),

		isArchived: boolean('is_archived').notNull().default(false),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),

		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('projects_created_by_idx').on(t.createdByUserId),
		index('projects_target_date_idx').on(t.targetDate),
		index('projects_archived_idx').on(t.isArchived),
	]
)

/* ------------------------------------------------------------------
   PROJECT CHECKPOINTS
------------------------------------------------------------------ */
export const projectCheckpoints = pgTable(
	'project_checkpoints',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		difficulty: difficultyEnum('difficulty').notNull().default('easy'),
		name: text('name').notNull(),

		// Optional supporting info
		url: text('url'),
		notes: text('notes'),

		sortOrder: integer('sort_order').notNull().default(0),
		estimatedDuration: integer('estimated_duration').notNull().default(1),
		isCompleted: boolean('is_completed').notNull().default(false),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		completedByUserId: uuid('completed_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('project_checkpoints_project_idx').on(t.projectId),
		index('project_checkpoints_sort_idx').on(t.projectId, t.sortOrder),
		index('project_checkpoints_completed_idx').on(t.isCompleted),
	]
)

/* ------------------------------------------------------------------
   CHECKPOINT COMPLETIONS (USER CONTRIBUTIONS)
------------------------------------------------------------------ */
export const projectCheckpointContributions = pgTable(
	'project_checkpoint_contributions',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		checkpointId: uuid('checkpoint_id')
			.notNull()
			.references(() => projectCheckpoints.id, { onDelete: 'cascade' }),

		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		minutesSpent: integer('minutes_spent').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('checkpoint_contrib_checkpoint_idx').on(t.checkpointId),
		index('checkpoint_contrib_user_idx').on(t.userId),
	]
)
