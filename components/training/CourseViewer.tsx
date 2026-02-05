'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { UserCourse } from '@/types/training'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { UnitOutline } from './UnitOutline'

type Props = {
	course: UserCourse
	locale: string
}

export function CourseViewer({ course, locale }: Props) {
	const firstUnitId = course.units[0]?.id ?? ''
	const [activeUnitId, setActiveUnitId] = useState(firstUnitId)

	const allLessons = useMemo(
		() => course.units.flatMap((unit) => unit.lessons),
		[course.units]
	)

	const continueLesson = useMemo(() => {
		return allLessons.find((lesson) => !lesson.isCompleted) ?? allLessons[0]
	}, [allLessons])

	const activeUnit = useMemo(() => {
		return course.units.find((u) => u.id === activeUnitId) ?? course.units[0]
	}, [course.units, activeUnitId])

	const percent =
		course.totalLessonCount > 0
			? Math.round(
					(course.completedLessonCount / course.totalLessonCount) * 100
			  )
			: 0

	return (
		<div className="space-y-4 min-w-0">
			<Card className="p-4 min-w-0">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between min-w-0">
					<div className="space-y-2 min-w-0">
						<h1 className="text-2xl font-semibold leading-tight break-words">
							{course.title}
						</h1>

						{course.description ? (
							<details className="text-sm text-muted-foreground max-w-2xl">
								<summary className="cursor-pointer select-none">
									About this course
								</summary>
								<p className="mt-2 break-words">{course.description}</p>
							</details>
						) : null}
					</div>

					<div className="flex flex-wrap gap-2 shrink-0">
						{continueLesson ? (
							<Button asChild>
								<Link
									href={`/${locale}/training/lessons/${continueLesson.id}`}
								>
									Continue
								</Link>
							</Button>
						) : null}
						<Button asChild variant="secondary">
							<Link href={`/${locale}/training`}>All courses</Link>
						</Button>
					</div>
				</div>

				<div className="mt-3 space-y-2 min-w-0">
					<div className="flex items-center justify-between text-sm min-w-0">
						<span className="text-muted-foreground">Progress</span>
						<span className="font-medium whitespace-nowrap">
							{course.completedLessonCount}/{course.totalLessonCount} •{' '}
							{percent}%
						</span>
					</div>
					<Progress value={percent} />
				</div>
			</Card>

			<div className="min-w-0">
				<UnitOutline
					units={course.units}
					activeUnitId={activeUnitId}
					onPickUnit={setActiveUnitId}
					locale={locale}
				/>

				{!activeUnit ? (
					<Card className="mt-3 p-6 text-sm text-muted-foreground">
						This course has no units yet.
					</Card>
				) : null}
			</div>
		</div>
	)
}
