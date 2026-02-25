// app/[locale]/(workers)/training/courses/[courseId]/page.tsx

import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { learningCourses, learningLessonCompletions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { UserCourse } from '@/types/training'
import { mapLessonBlock } from '@/lib/training/block-mapper'
import { CourseViewer } from '@/components/training/CourseViewer'
import { getCourseBadgeUrl } from '@/lib/storage/courseBadges.server'

type Props = {
	params: { locale: string; courseId: string }
}

export default async function CoursePage({ params }: Props) {
	const { locale, courseId } = await params

	const user = await getCurrentUser()
	if (!user) return null

	const course = await db.query.learningCourses.findFirst({
		where: eq(learningCourses.id, courseId),
		with: {
			units: {
				with: {
					lessons: {
						with: {
							blocks: true,
						},
					},
				},
			},
		},
	})

	if (!course || !course.isPublished) notFound()

	const completions = await db
		.select({
			lessonId: learningLessonCompletions.lessonId,
		})
		.from(learningLessonCompletions)
		.where(eq(learningLessonCompletions.userId, user.id))

	const completedLessonIds = new Set(completions.map((c) => c.lessonId))

	const lessons = course.units.flatMap((u) => u.lessons)
	const completedCount = lessons.filter((l) =>
		completedLessonIds.has(l.id)
	).length

	const userCourse: UserCourse = {
		id: course.id,
		title: course.title,
		description: course.description,
		badgeImageUrl: getCourseBadgeUrl(course.badgeImagePath),
		badgeIconName: course.badgeIconName,
		sortOrder: course.sortOrder,
		contentVersion: course.contentVersion,
		completedLessonCount: completedCount,
		totalLessonCount: lessons.length,
		isCompleted: completedCount === lessons.length,
		units: course.units.map((unit) => ({
			id: unit.id,
			title: unit.title,
			lessons: unit.lessons.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				isCompleted: completedLessonIds.has(lesson.id),
				blocks: lesson.blocks.map(mapLessonBlock),
			})),
		})),
	}

	return (
		<div className="p-4 space-y-4">
			<CourseViewer course={userCourse} locale={locale} />
		</div>
	)
}
