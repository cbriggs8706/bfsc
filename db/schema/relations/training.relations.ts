// db/schema/relations/training.relations.ts
import { relations } from 'drizzle-orm'
import { user } from '../tables/auth'
import {
	learningCourses,
	learningUnits,
	learningLessons,
	learningLessonBlocks,
	learningLessonCompletions,
	learningCourseCompletions,
	userCertificates,
} from '../tables/training'

export const learningCoursesRelations = relations(
	learningCourses,
	({ many }) => ({
		units: many(learningUnits),
		courseCompletions: many(learningCourseCompletions),
		certificates: many(userCertificates),
	})
)

export const learningUnitsRelations = relations(
	learningUnits,
	({ one, many }) => ({
		course: one(learningCourses, {
			fields: [learningUnits.courseId],
			references: [learningCourses.id],
		}),
		lessons: many(learningLessons),
	})
)

export const learningLessonsRelations = relations(
	learningLessons,
	({ one, many }) => ({
		unit: one(learningUnits, {
			fields: [learningLessons.unitId],
			references: [learningUnits.id],
		}),
		blocks: many(learningLessonBlocks),
		completions: many(learningLessonCompletions),
	})
)

export const learningLessonBlocksRelations = relations(
	learningLessonBlocks,
	({ one }) => ({
		lesson: one(learningLessons, {
			fields: [learningLessonBlocks.lessonId],
			references: [learningLessons.id],
		}),
	})
)

export const learningLessonCompletionsRelations = relations(
	learningLessonCompletions,
	({ one }) => ({
		user: one(user, {
			fields: [learningLessonCompletions.userId],
			references: [user.id],
		}),
		lesson: one(learningLessons, {
			fields: [learningLessonCompletions.lessonId],
			references: [learningLessons.id],
		}),
	})
)

export const learningCourseCompletionsRelations = relations(
	learningCourseCompletions,
	({ one }) => ({
		user: one(user, {
			fields: [learningCourseCompletions.userId],
			references: [user.id],
		}),
		course: one(learningCourses, {
			fields: [learningCourseCompletions.courseId],
			references: [learningCourses.id],
		}),
	})
)

export const userCertificatesRelations = relations(
	userCertificates,
	({ one }) => ({
		user: one(user, {
			fields: [userCertificates.userId],
			references: [user.id],
		}),
		course: one(learningCourses, {
			fields: [userCertificates.courseId],
			references: [learningCourses.id],
		}),
	})
)
