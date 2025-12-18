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
	userCertificates,
} from '@/db'
import { LessonBlockInput, LessonBlockTypeMap } from '@/types/training'

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
	await db.insert(learningCourses).values({
		...data,
		contentVersion: 1,
	})
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
	await db.transaction(async (tx) => {
		await tx.insert(learningUnits).values(data)

		// 🔁 bump course version (new required content)
		await tx
			.update(learningCourses)
			.set({
				contentVersion: sql`${learningCourses.contentVersion} + 1`,
			})
			.where(eq(learningCourses.id, data.courseId))
	})
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
	await db.transaction(async (tx) => {
		const unit = await tx.query.learningUnits.findFirst({
			where: eq(learningUnits.id, unitId),
			columns: { courseId: true },
		})

		if (!unit) return

		await tx.delete(learningUnits).where(eq(learningUnits.id, unitId))

		await tx
			.update(learningCourses)
			.set({
				contentVersion: sql`${learningCourses.contentVersion} + 1`,
			})
			.where(eq(learningCourses.id, unit.courseId))
	})
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
	await db.transaction(async (tx) => {
		const lesson = await tx.query.learningLessons.findFirst({
			where: eq(learningLessons.id, lessonId),
			with: {
				unit: {
					columns: { courseId: true },
				},
			},
		})

		if (!lesson?.unit) return

		await tx.delete(learningLessons).where(eq(learningLessons.id, lessonId))

		await tx
			.update(learningCourses)
			.set({
				contentVersion: sql`${learningCourses.contentVersion} + 1`,
			})
			.where(eq(learningCourses.id, lesson.unit.courseId))
	})
}

/* ============================================================
   ADMIN: LESSON BLOCKS (no version bump)
============================================================ */

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
	data: Partial<LessonBlockInput> & { sortOrder?: number }
) {
	await db
		.update(learningLessonBlocks)
		.set({
			...(data.type && { type: data.type }),
			...(data.data && { data: data.data }),
			...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
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

	await maybeIssueCertificate(user.id, lessonId)
}

/* ============================================================
   INTERNAL: CERTIFICATE ISSUANCE (VERSIONED)
============================================================ */

async function maybeIssueCertificate(userId: string, lessonId: string) {
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

	const course = lesson.unit.course

	// all lesson ids for course
	const lessons = await db
		.select({ id: learningLessons.id })
		.from(learningLessons)
		.innerJoin(learningUnits, eq(learningLessons.unitId, learningUnits.id))
		.where(eq(learningUnits.courseId, course.id))

	const lessonIds = lessons.map((l) => l.id)
	if (!lessonIds.length) return

	const completed = await db
		.select({ lessonId: learningLessonCompletions.lessonId })
		.from(learningLessonCompletions)
		.where(
			and(
				eq(learningLessonCompletions.userId, userId),
				inArray(learningLessonCompletions.lessonId, lessonIds)
			)
		)

	if (completed.length !== lessonIds.length) return

	// 🔒 check if certificate already issued for THIS VERSION
	const existing = await db.query.userCertificates.findFirst({
		where: and(
			eq(userCertificates.userId, userId),
			eq(userCertificates.courseId, course.id),
			eq(userCertificates.courseVersion, course.contentVersion)
		),
	})

	if (existing) return

	await db.insert(userCertificates).values({
		userId,
		source: 'internal',
		courseId: course.id,
		courseVersion: course.contentVersion,
		title: course.title,
		category: course.category,
		level: course.level,
	})
}

/* ============================================================
   USER: READ HELPERS
============================================================ */

export async function getUserCertificates() {
	const user = await getCurrentUser()
	if (!user) return []

	return db.query.userCertificates.findMany({
		where: eq(userCertificates.userId, user.id),
		orderBy: (t, { desc }) => desc(t.issuedAt),
	})
}
