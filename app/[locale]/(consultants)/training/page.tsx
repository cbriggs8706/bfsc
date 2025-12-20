// app/[locale]/(consultants)/training/page.tsx

import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { learningCourses, learningLessonCompletions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { UserCourse } from '@/types/training'
import { redirect } from 'next/navigation'
import { CourseCatalog } from '@/components/training/CourseCatalog'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function TrainingCatalogPage({ params }: Props) {
	const { locale } = await params
	const user = await getCurrentUser()

	if (!user || user.role === 'Patron') {
		redirect(`/${locale}/login?redirect=/${locale}/training`)
	}

	const courses = await db.query.learningCourses.findMany({
		where: eq(learningCourses.isPublished, true),
		orderBy: (courses, { asc }) => [asc(courses.sortOrder)],
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
			sortOrder: course.sortOrder,
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

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Consultant Training</h1>
				<p className="text-sm text-muted-foreground">
					Each course will earn a certificate. If additional lessons are added
					to a course, you&apos;ll need to update to keep your certification
					current.
				</p>
			</div>
			<CourseCatalog courses={userCourses} locale={locale} />
		</div>
	)
}
