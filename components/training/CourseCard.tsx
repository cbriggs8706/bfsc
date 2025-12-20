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
		<Card className="p-4">
			<div className="flex gap-4 items-start">
				{/* Order badge */}
				{typeof course.sortOrder === 'number' && course.sortOrder > 0 && (
					<div className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base">
						{course.sortOrder}
					</div>
				)}

				{/* Content */}
				<div className="flex-1 space-y-3">
					<h3 className="font-semibold leading-tight">{course.title}</h3>

					{course.description && (
						<p className="text-sm text-muted-foreground">
							{course.description}
						</p>
					)}

					<CourseProgressBar
						completed={course.completedLessonCount}
						total={course.totalLessonCount}
					/>

					<Link href={`/${locale}/training/courses/${course.id}`}>
						<Button variant="default">
							{course.isCompleted ? 'Review Course' : 'Continue'}
						</Button>
					</Link>
				</div>
			</div>
		</Card>
	)
}
