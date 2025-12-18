import { CoursesManager } from '@/components/training/admin/CoursesManager'
import { db } from '@/db'
import { learningCourses } from '@/db'
import { asc } from 'drizzle-orm'

type Props = {
	params: { locale: string }
}

export default async function AdminCoursesPage({ params }: Props) {
	const { locale } = await params

	const courses = await db
		.select({
			id: learningCourses.id,
			title: learningCourses.title,
			slug: learningCourses.slug,
		})
		.from(learningCourses)
		.orderBy(asc(learningCourses.sortOrder))

	return <CoursesManager courses={courses} locale={locale} />
}
