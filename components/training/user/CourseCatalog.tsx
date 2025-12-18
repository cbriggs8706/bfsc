'use client'

import { UserCourse } from '@/types/training'
import { CourseCard } from './CourseCard'

type Props = {
	courses: UserCourse[]
	locale: string
}

export function CourseCatalog({ courses, locale }: Props) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} locale={locale} />
			))}
		</div>
	)
}
