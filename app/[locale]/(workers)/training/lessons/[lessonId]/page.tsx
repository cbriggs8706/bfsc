import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import {
	learningCourses,
	learningLessons,
	learningLessonCompletions,
} from '@/db'
import { notFound } from 'next/navigation'
import { UserLesson } from '@/types/training'
import { mapLessonBlock } from '@/lib/training/block-mapper'
import { LessonViewer } from '@/components/training/LessonViewer'
import { getCurrentUser } from '@/lib/auth'

type Props = {
	params: { locale: string; lessonId: string }
}

export default async function LessonPage({ params }: Props) {
	const { locale, lessonId } = await params

	const user = await getCurrentUser()
	if (!user) return null

	const lesson = await db.query.learningLessons.findFirst({
		where: eq(learningLessons.id, lessonId),
		with: {
			blocks: {
				orderBy: (t, { asc }) => asc(t.sortOrder),
			},
			unit: true,
		},
	})

	if (!lesson) notFound()

	const course = await db.query.learningCourses.findFirst({
		where: eq(learningCourses.id, lesson.unit.courseId),
		with: {
			units: {
				orderBy: (t, { asc }) => asc(t.sortOrder),
				with: {
					lessons: {
						orderBy: (t, { asc }) => asc(t.sortOrder),
					},
				},
			},
		},
	})

	const completion = await db.query.learningLessonCompletions.findFirst({
		where: and(
			eq(learningLessonCompletions.userId, user.id),
			eq(learningLessonCompletions.lessonId, lessonId)
		),
	})

	const userLesson: UserLesson = {
		id: lesson.id,
		title: lesson.title,
		isCompleted: Boolean(completion),
		blocks: lesson.blocks.map(mapLessonBlock),
	}

	const orderedLessons = course?.units.flatMap((unit) => unit.lessons) ?? []
	const currentIndex = orderedLessons.findIndex((l) => l.id === lesson.id)
	const prevLessonId =
		currentIndex > 0 ? orderedLessons[currentIndex - 1]?.id : null
	const nextLessonId =
		currentIndex >= 0 && currentIndex < orderedLessons.length - 1
			? orderedLessons[currentIndex + 1]?.id
			: null

	return (
		<LessonViewer
			lesson={userLesson}
			locale={locale}
			courseId={course?.id ?? lesson.unit.courseId}
			prevLessonId={prevLessonId}
			nextLessonId={nextLessonId}
		/>
	)
}
