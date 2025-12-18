import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { learningCourses, learningLessonCompletions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { CourseCatalog } from '@/components/training/user/CourseCatalog'
import { UserCourse } from '@/types/training'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function TrainingCatalogPage({ params }: Props) {
	const { locale } = await params
	const user = await getCurrentUser()
	if (!user) return null

	const courses = await db.query.learningCourses.findMany({
		where: eq(learningCourses.isPublished, true),
		with: {
			units: {
				with: {
					lessons: true,
				},
			},
		},
	})

	const completions = await db
		.select({
			lessonId: learningLessonCompletions.lessonId,
		})
		.from(learningLessonCompletions)
		.where(eq(learningLessonCompletions.userId, user.id))

	const completedLessonIds = new Set(completions.map((c) => c.lessonId))

	const userCourses: UserCourse[] = courses.map((course) => {
		const lessons = course.units.flatMap((u) => u.lessons)
		const completedCount = lessons.filter((l) =>
			completedLessonIds.has(l.id)
		).length

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			contentVersion: course.contentVersion,
			units: course.units.map((unit) => ({
				id: unit.id,
				title: unit.title,
				lessons: unit.lessons.map((lesson) => ({
					id: lesson.id,
					title: lesson.title,
					isCompleted: completedLessonIds.has(lesson.id),
					blocks: [],
				})),
			})),
			completedLessonCount: completedCount,
			totalLessonCount: lessons.length,
			isCompleted: completedCount === lessons.length,
		}
	})

	return <CourseCatalog courses={userCourses} locale={locale} />
}
