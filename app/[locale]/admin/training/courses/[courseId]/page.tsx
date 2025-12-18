import { db } from '@/db'
import { eq, asc } from 'drizzle-orm'
import {
	learningCourses,
	learningUnits,
	learningLessons,
	learningLessonBlocks,
} from '@/db'
import { notFound } from 'next/navigation'
import { CourseEditor } from '@/components/training/admin/CourseEditor'
import { AdminCourse, AdminLesson, AdminUnit } from '@/types/training'
import { mapLessonBlock } from '@/lib/training/block-mapper'

type Props = {
	params: { locale: string; courseId: string }
}

export default async function AdminCourseEditorPage({ params }: Props) {
	const { locale, courseId } = await params

	const course = await db.query.learningCourses.findFirst({
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
	})

	if (!course) notFound()
	const adminCourse: AdminCourse = {
		...course,
		units: course.units.map<AdminUnit>((unit) => ({
			...unit,
			lessons: unit.lessons.map<AdminLesson>((lesson) => ({
				...lesson,
				blocks: lesson.blocks.map(mapLessonBlock),
			})),
		})),
	}
	return <CourseEditor course={adminCourse} locale={locale} />
}
