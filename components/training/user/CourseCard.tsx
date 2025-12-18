'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { UserCourse } from '@/types/training'
import { CourseProgressBar } from './CourseProgressBar'
import { Button } from '@/components/ui/button'

type Props = {
	course: UserCourse
	locale: string
}

export function CourseCard({ course, locale }: Props) {
	return (
		<Card className="p-4 space-y-3">
			<h3 className="font-semibold">{course.title}</h3>

			{course.description && (
				<p className="text-sm text-muted-foreground">{course.description}</p>
			)}

			<CourseProgressBar
				completed={course.completedLessonCount}
				total={course.totalLessonCount}
			/>

			<Link
				href={`/${locale}/training/courses/${course.id}`}
				className="text-sm underline"
			>
				<Button variant="default">
					{course.isCompleted ? 'Review Course' : 'Continue'}
				</Button>
			</Link>
		</Card>
	)
}
