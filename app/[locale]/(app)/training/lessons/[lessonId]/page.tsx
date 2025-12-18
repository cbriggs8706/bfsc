import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { learningLessons } from '@/db'
import { LessonViewer } from '@/components/training/user/LessonViewer'
import { notFound } from 'next/navigation'
import { UserLesson } from '@/types/training'
import { mapLessonBlock } from '@/lib/training/block-mapper'

type Props = {
	params: { locale: string; lessonId: string }
}

export default async function LessonPage({ params }: Props) {
	const { locale, lessonId } = await params

	const lesson = await db.query.learningLessons.findFirst({
		where: eq(learningLessons.id, lessonId),
		with: {
			blocks: {
				orderBy: (t, { asc }) => asc(t.sortOrder),
			},
		},
	})

	if (!lesson) notFound()

	const userLesson: UserLesson = {
		id: lesson.id,
		title: lesson.title,
		isCompleted: false, // completion handled in course view
		blocks: lesson.blocks.map(mapLessonBlock),
	}

	return <LessonViewer lesson={userLesson} />
}
