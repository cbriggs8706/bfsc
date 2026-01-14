'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourse, updateCourse } from '@/app/actions/training'
import { AdminCourse } from '@/types/training'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CourseBadgeUploader } from './CourseBadgeUploader'
import { getCourseBadgeUrlFromPath } from '@/lib/storage/courseBadges.client'
import { UnitsOutline } from './UnitsOutline'
import { LessonBlocksEditor } from './LessonBlocksEditor'

type Props = {
	course: AdminCourse
	locale: string
}

export function CourseEditor({ course, locale }: Props) {
	const router = useRouter()
	const badgeUrl = getCourseBadgeUrlFromPath(course.badgeImagePath)

	// One stable shape. No unions. No "any".
	const [selection, setSelection] = useState({
		kind: 'course',
		unitId: '',
		lessonId: '',
	})

	const selectedLesson = useMemo(() => {
		if (selection.kind !== 'lesson' || !selection.lessonId) return null

		for (const unit of course.units) {
			for (const lesson of unit.lessons) {
				if (lesson.id === selection.lessonId) return lesson
			}
		}
		return null
	}, [course.units, selection.kind, selection.lessonId])

	return (
		<div className="grid gap-4 lg:grid-cols-[320px_1fr]">
			{/* LEFT: outline */}
			<Card className="p-3 lg:sticky lg:top-4 h-fit">
				<div className="space-y-2">
					<div>
						<div className="text-sm text-muted-foreground">Course</div>
						<button
							onClick={() =>
								setSelection({
									kind: 'course',
									unitId: '',
									lessonId: '',
								})
							}
							className="text-left font-medium hover:underline"
						>
							{course.title}
						</button>
					</div>

					<Separator />

					<UnitsOutline
						courseId={course.id}
						units={course.units}
						selection={selection}
						onSelect={setSelection}
					/>
				</div>
			</Card>

			{/* RIGHT: editor */}
			<div className="space-y-4">
				{selection.kind === 'course' && (
					<Card className="p-4 space-y-4">
						<div className="space-y-1">
							<h2 className="text-xl font-semibold">Course settings</h2>
							<p className="text-sm text-muted-foreground">
								Edit the basics, then use the outline to manage units and
								lessons.
							</p>
						</div>

						<div className="space-y-3">
							<div className="space-y-1">
								<Label>Title</Label>
								<Input
									defaultValue={course.title}
									onBlur={(e) =>
										updateCourse(course.id, { title: e.target.value })
									}
								/>
							</div>

							<div className="space-y-1">
								<Label>Description</Label>
								<Textarea
									defaultValue={course.description ?? ''}
									placeholder="Describe the course"
									onBlur={(e) =>
										updateCourse(course.id, { description: e.target.value })
									}
								/>
							</div>

							<div className="space-y-1">
								<Label>Badge image</Label>
								<CourseBadgeUploader
									courseId={course.id}
									initialUrl={badgeUrl}
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<div className="text-sm font-medium text-destructive">
								Danger zone
							</div>
							<Button
								variant="destructive"
								onClick={async () => {
									if (!confirm('Delete this course and all units/lessons?'))
										return
									await deleteCourse(course.id)
									router.push(`/${locale}/admin/training/courses`)
									router.refresh()
								}}
							>
								Delete course
							</Button>
						</div>
					</Card>
				)}

				{selection.kind === 'unit' && (
					<Card className="p-4 space-y-2">
						<h2 className="text-xl font-semibold">Unit</h2>
						<p className="text-sm text-muted-foreground">
							Select a lesson on the left to edit its content blocks.
						</p>
					</Card>
				)}

				{selection.kind === 'lesson' && selectedLesson && (
					<Card className="p-4 space-y-4">
						<div className="space-y-1">
							<h2 className="text-xl font-semibold">{selectedLesson.title}</h2>
							<p className="text-sm text-muted-foreground">
								Add blocks in the order learners will see them.
							</p>
						</div>

						<LessonBlocksEditor
							lessonId={selectedLesson.id}
							blocks={selectedLesson.blocks}
						/>
					</Card>
				)}
			</div>
		</div>
	)
}
