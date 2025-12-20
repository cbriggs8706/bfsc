import { db } from '@/db'
import { and, asc, desc, eq } from 'drizzle-orm'
import {
	learningCourses,
	learningUnits,
	learningLessons,
	learningLessonBlocks,
	learningLessonCompletions,
	userCertificates,
} from '@/db'

import { mapLessonBlock } from '@/lib/training/block-mapper'
import {
	UserCertificate,
	UserCourse,
	UserLesson,
	UserUnit,
} from '@/types/training'
import { getCourseBadgeUrl } from '@/lib/storage/courseBadges.server'

//TODO use these to replace defaults in various pages that were created
/**
 * Certificates for a user (internal + external)
 */
export type CertificateStatus =
	| 'current' // matches course version
	| 'renewal' // user completed older version
	| 'expired' // course no longer exists or unpublished
	| 'external' // external source

export type UserCertificateWithStatus = UserCertificate & {
	status: CertificateStatus
	badgeImageUrl?: string | null
}

export async function getUserCertificates(
	userId: string
): Promise<UserCertificateWithStatus[]> {
	const rows = await db
		.select({
			id: userCertificates.id,
			userId: userCertificates.userId,
			courseId: userCertificates.courseId,
			courseVersion: userCertificates.courseVersion,
			title: userCertificates.title,
			category: userCertificates.category,
			level: userCertificates.level,
			source: userCertificates.source,
			issuedAt: userCertificates.issuedAt,
			verifyUrl: userCertificates.verifyUrl,

			currentCourseVersion: learningCourses.contentVersion,
			isPublished: learningCourses.isPublished,
			badgeImagePath: learningCourses.badgeImagePath,
		})
		.from(userCertificates)
		.leftJoin(
			learningCourses,
			eq(userCertificates.courseId, learningCourses.id)
		)
		.where(eq(userCertificates.userId, userId))
		.orderBy(desc(userCertificates.issuedAt))

	return rows.map((row) => {
		let status: CertificateStatus = 'external'

		if (row.source === 'internal') {
			if (!row.courseId || !row.isPublished) {
				status = 'expired'
			} else if (row.courseVersion === row.currentCourseVersion) {
				status = 'current'
			} else {
				status = 'renewal'
			}
		}

		return {
			id: row.id,
			userId: row.userId,
			courseId: row.courseId,
			courseVersion: row.courseVersion,
			title: row.title,
			category: row.category,
			level: row.level,
			source: row.source,
			issuedAt: row.issuedAt,
			verifyUrl: row.verifyUrl,
			status,
			badgeImageUrl: getCourseBadgeUrl(row.badgeImagePath),
		}
	})
}

/**
 * Published courses with progress for a user (catalog view).
 * Lessons are included but blocks are omitted for performance.
 */
export async function getPublishedCoursesWithProgress(
	userId: string
): Promise<UserCourse[]> {
	const [courses, completions] = await Promise.all([
		db.query.learningCourses.findMany({
			where: eq(learningCourses.isPublished, true),
			with: {
				units: {
					orderBy: [asc(learningUnits.sortOrder)],
					with: {
						lessons: {
							orderBy: [asc(learningLessons.sortOrder)],
						},
					},
				},
			},
			orderBy: [asc(learningCourses.sortOrder)],
		}),
		db
			.select({
				lessonId: learningLessonCompletions.lessonId,
			})
			.from(learningLessonCompletions)
			.where(eq(learningLessonCompletions.userId, userId)),
	])

	const completedLessonIds = new Set(completions.map((c) => c.lessonId))

	return courses.map((course) => {
		const allLessons = course.units.flatMap((u) => u.lessons)
		const completedLessonCount = allLessons.filter((l) =>
			completedLessonIds.has(l.id)
		).length

		const units: UserUnit[] = course.units.map((unit) => ({
			id: unit.id,
			title: unit.title,
			lessons: unit.lessons.map<UserLesson>((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				isCompleted: completedLessonIds.has(lesson.id),
				blocks: [], // catalog view: omit blocks
			})),
		}))

		const totalLessonCount = allLessons.length
		const isCompleted =
			totalLessonCount > 0 && completedLessonCount === totalLessonCount

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			sortOrder: course.sortOrder,
			contentVersion: course.contentVersion,
			units,
			completedLessonCount,
			totalLessonCount,
			isCompleted,
		}
	})
}

/**
 * Single published course with progress AND blocks (course viewer view).
 */
export async function getPublishedCourseForUser(
	userId: string,
	courseId: string
): Promise<UserCourse | null> {
	const [course, completions] = await Promise.all([
		db.query.learningCourses.findFirst({
			where: eq(learningCourses.id, courseId),
			with: {
				units: {
					orderBy: [asc(learningUnits.sortOrder)],
					with: {
						lessons: {
							orderBy: [asc(learningLessons.sortOrder)],
							with: {
								blocks: {
									orderBy: [asc(learningLessonBlocks.sortOrder)],
								},
							},
						},
					},
				},
			},
		}),
		db
			.select({
				lessonId: learningLessonCompletions.lessonId,
			})
			.from(learningLessonCompletions)
			.where(eq(learningLessonCompletions.userId, userId)),
	])

	if (!course || !course.isPublished) return null

	const completedLessonIds = new Set(completions.map((c) => c.lessonId))

	const allLessons = course.units.flatMap((u) => u.lessons)
	const completedLessonCount = allLessons.filter((l) =>
		completedLessonIds.has(l.id)
	).length

	const units: UserUnit[] = course.units.map((unit) => ({
		id: unit.id,
		title: unit.title,
		lessons: unit.lessons.map<UserLesson>((lesson) => ({
			id: lesson.id,
			title: lesson.title,
			isCompleted: completedLessonIds.has(lesson.id),
			blocks: lesson.blocks.map(mapLessonBlock),
		})),
	}))

	const totalLessonCount = allLessons.length
	const isCompleted =
		totalLessonCount > 0 && completedLessonCount === totalLessonCount

	return {
		id: course.id,
		title: course.title,
		description: course.description,
		sortOrder: course.sortOrder,
		contentVersion: course.contentVersion,
		units,
		completedLessonCount,
		totalLessonCount,
		isCompleted,
	}
}

/**
 * Single lesson with blocks for user viewing.
 * (Completion is handled elsewhere; this returns isCompleted=false by default.)
 */
export async function getLessonForUser(
	lessonId: string
): Promise<UserLesson | null> {
	const lesson = await db.query.learningLessons.findFirst({
		where: eq(learningLessons.id, lessonId),
		with: {
			blocks: {
				orderBy: [asc(learningLessonBlocks.sortOrder)],
			},
		},
	})

	if (!lesson) return null

	return {
		id: lesson.id,
		title: lesson.title,
		isCompleted: false,
		blocks: lesson.blocks.map(mapLessonBlock),
	}
}

export async function getCurrentInternalCertificates(userId: string) {
	const rows = await db
		.select({
			id: userCertificates.id,
			courseId: userCertificates.courseId,
			courseVersion: userCertificates.courseVersion,
			title: userCertificates.title,
			category: userCertificates.category,
			level: userCertificates.level,
			issuedAt: userCertificates.issuedAt,
		})
		.from(userCertificates)
		.innerJoin(
			learningCourses,
			eq(userCertificates.courseId, learningCourses.id)
		)
		.where(
			and(
				eq(userCertificates.userId, userId),
				eq(userCertificates.source, 'internal'),
				eq(userCertificates.courseVersion, learningCourses.contentVersion)
			)
		)

	return rows
}
