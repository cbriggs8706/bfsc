// app/actions/training.ts
'use server'

import { db } from '@/db'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

import {
	learningCourses,
	learningUnits,
	learningLessons,
	learningLessonBlocks,
	learningLessonCompletions,
	learningCourseCompletions,
	userCertificates,
} from '@/db'
import { LessonBlockInput } from '@/types/training'

/* ============================================================
   ADMIN: COURSES
============================================================ */

export async function createCourse(data: {
	title: string
	slug: string
	description?: string
	category?: string
	level?: number
	coverImagePath?: string
	sortOrder?: number
}) {
	await db.insert(learningCourses).values(data)
}

export async function updateCourse(
	courseId: string,
	data: Partial<typeof learningCourses.$inferInsert>
) {
	await db
		.update(learningCourses)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(learningCourses.id, courseId))
}

export async function deleteCourse(courseId: string) {
	await db.delete(learningCourses).where(eq(learningCourses.id, courseId))
}

/* ============================================================
   ADMIN: UNITS
============================================================ */

export async function createUnit(data: {
	courseId: string
	title: string
	description?: string
	sortOrder?: number
}) {
	await db.insert(learningUnits).values(data)
}

export async function updateUnit(
	unitId: string,
	data: Partial<typeof learningUnits.$inferInsert>
) {
	await db
		.update(learningUnits)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(learningUnits.id, unitId))
}

export async function deleteUnit(unitId: string) {
	await db.delete(learningUnits).where(eq(learningUnits.id, unitId))
}

/* ============================================================
   ADMIN: LESSONS
============================================================ */

export async function createLesson(input: { unitId: string; title: string }) {
	await db.transaction(async (tx) => {
		await tx.insert(learningLessons).values({
			unitId: input.unitId,
			title: input.title,
		})

		const unit = await tx.query.learningUnits.findFirst({
			where: eq(learningUnits.id, input.unitId),
			columns: { courseId: true },
		})

		if (!unit) throw new Error('Unit not found')

		await tx
			.update(learningCourses)
			.set({
				contentVersion: sql`${learningCourses.contentVersion} + 1`,
			})
			.where(eq(learningCourses.id, unit.courseId))
	})
}

export async function updateLesson(
	lessonId: string,
	data: Partial<typeof learningLessons.$inferInsert>
) {
	await db
		.update(learningLessons)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(learningLessons.id, lessonId))
}

export async function deleteLesson(lessonId: string) {
	await db.delete(learningLessons).where(eq(learningLessons.id, lessonId))
}

/* ============================================================
   ADMIN: LESSON BLOCKS
============================================================ */
import { LessonBlockTypeMap } from '@/types/training'

export async function createLessonBlock<
	T extends keyof LessonBlockTypeMap
>(input: {
	lessonId: string
	type: T
	sortOrder?: number
	data: LessonBlockTypeMap[T]
}) {
	await db.insert(learningLessonBlocks).values({
		lessonId: input.lessonId,
		type: input.type,
		sortOrder: input.sortOrder ?? 0,
		data: input.data,
	})
}

export async function updateLessonBlock(
	blockId: string,
	data: Partial<LessonBlockInput> & {
		sortOrder?: number
	}
) {
	await db
		.update(learningLessonBlocks)
		.set({
			...(data.type && { type: data.type }),
			...(data.data && { data: data.data }),
			...(data.sortOrder !== undefined && {
				sortOrder: data.sortOrder,
			}),
			updatedAt: new Date(),
		})
		.where(eq(learningLessonBlocks.id, blockId))
}

export async function deleteLessonBlock(blockId: string) {
	await db
		.delete(learningLessonBlocks)
		.where(eq(learningLessonBlocks.id, blockId))
}

/* ============================================================
   USER: LESSON COMPLETION
============================================================ */

export async function toggleLessonCompletion(
	lessonId: string,
	complete: boolean
) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Not authenticated')

	if (complete) {
		await db
			.insert(learningLessonCompletions)
			.values({ userId: user.id, lessonId })
			.onConflictDoNothing()
	} else {
		await db
			.delete(learningLessonCompletions)
			.where(
				and(
					eq(learningLessonCompletions.userId, user.id),
					eq(learningLessonCompletions.lessonId, lessonId)
				)
			)
	}

	await recomputeCourseCompletionForLesson(user.id, lessonId)
}

/* ============================================================
   INTERNAL: COURSE COMPLETION LOGIC
============================================================ */

async function recomputeCourseCompletionForLesson(
	userId: string,
	lessonId: string
) {
	// Find the course for this lesson
	const lesson = await db.query.learningLessons.findFirst({
		where: eq(learningLessons.id, lessonId),
		with: {
			unit: {
				with: {
					course: true,
				},
			},
		},
	})

	if (!lesson?.unit?.course) return

	const courseId = lesson.unit.course.id

	// All lesson IDs in the course
	const lessons = await db
		.select({ id: learningLessons.id })
		.from(learningLessons)
		.innerJoin(learningUnits, eq(learningLessons.unitId, learningUnits.id))
		.where(eq(learningUnits.courseId, courseId))

	const lessonIds = lessons.map((l) => l.id)

	if (lessonIds.length === 0) return

	// Completed lesson count
	const completed = await db
		.select({ id: learningLessonCompletions.lessonId })
		.from(learningLessonCompletions)
		.where(
			and(
				eq(learningLessonCompletions.userId, userId),
				inArray(learningLessonCompletions.lessonId, lessonIds)
			)
		)

	const isComplete = completed.length === lessonIds.length

	if (isComplete) {
		await issueInternalCertificate(userId, courseId)
	} else {
		await revokeInternalCertificate(userId, courseId)
	}
}

/* ============================================================
   INTERNAL: CERTIFICATE ISSUANCE
============================================================ */

async function issueInternalCertificate(userId: string, courseId: string) {
	// Avoid duplicates
	const existing = await db.query.learningCourseCompletions.findFirst({
		where: and(
			eq(learningCourseCompletions.userId, userId),
			eq(learningCourseCompletions.courseId, courseId)
		),
	})

	if (existing) return

	const course = await db.query.learningCourses.findFirst({
		where: eq(learningCourses.id, courseId),
	})

	if (!course) return

	const [certificate] = await db
		.insert(userCertificates)
		.values({
			userId,
			source: 'internal',
			courseId,
			title: course.title,
			category: course.category,
			level: course.level,
		})
		.returning({ id: userCertificates.id })

	await db.insert(learningCourseCompletions).values({
		userId,
		courseId,
		certificateId: certificate.id,
	})
}

async function revokeInternalCertificate(userId: string, courseId: string) {
	const completion = await db.query.learningCourseCompletions.findFirst({
		where: and(
			eq(learningCourseCompletions.userId, userId),
			eq(learningCourseCompletions.courseId, courseId)
		),
	})

	if (!completion) return

	await db
		.delete(userCertificates)
		.where(eq(userCertificates.id, completion.certificateId!))

	await db
		.delete(learningCourseCompletions)
		.where(
			and(
				eq(learningCourseCompletions.userId, userId),
				eq(learningCourseCompletions.courseId, courseId)
			)
		)
}

/* ============================================================
   USER: READ HELPERS (OPTIONAL BUT PRACTICAL)
============================================================ */

export async function getUserCertificates() {
	const user = await getCurrentUser()
	if (!user) return []

	return db.query.userCertificates.findMany({
		where: eq(userCertificates.userId, user.id),
		orderBy: (t, { desc }) => desc(t.issuedAt),
	})
}

export async function getUserLessonCompletions(courseId: string) {
	const user = await getCurrentUser()
	if (!user) return []

	return db
		.select({ lessonId: learningLessonCompletions.lessonId })
		.from(learningLessonCompletions)
		.innerJoin(
			learningLessons,
			eq(learningLessonCompletions.lessonId, learningLessons.id)
		)
		.innerJoin(learningUnits, eq(learningLessons.unitId, learningUnits.id))
		.where(
			and(
				eq(learningLessonCompletions.userId, user.id),
				eq(learningUnits.courseId, courseId)
			)
		)
}
