import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { learningLessons, learningLessonCompletions } from '@/db'
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
		},
	})

	if (!lesson) notFound()

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

	return <LessonViewer lesson={userLesson} locale={locale} />
}
