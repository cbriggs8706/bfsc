'use client'

import { UserCourse } from '@/types/training'
import { UnitSection } from './UnitSection'

type Props = {
	course: UserCourse
	locale: string
}

export function CourseViewer({ course, locale }: Props) {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">{course.title}</h1>

			{course.description && (
				<p className="text-muted-foreground">{course.description}</p>
			)}

			{course.units.map((unit) => (
				<UnitSection key={unit.id} unit={unit} locale={locale} />
			))}
		</div>
	)
}
