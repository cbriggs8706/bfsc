'use client'

import { deleteCourse, updateCourse } from '@/app/actions/training'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AdminCourse } from '@/types/training'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { UnitsEditor } from './UnitsEditor'
import { CourseBadgeUploader } from './CourseBadgeUploader'
import { getCourseBadgeUrlFromPath } from '@/lib/storage/courseBadges.client'

type Props = {
	course: AdminCourse
	locale: string
}

export function CourseEditor({ course, locale }: Props) {
	const router = useRouter()
	const badgeUrl = getCourseBadgeUrlFromPath(course.badgeImagePath)

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Label>Course Title</Label>
				<Input
					defaultValue={course.title}
					onBlur={(e) => updateCourse(course.id, { title: e.target.value })}
				/>
				{/* <Input
					defaultValue={course.slug}
					onBlur={(e) => updateCourse(course.id, { slug: e.target.value })}
					/> */}

				<Label>Course Description</Label>

				<Label>Badge Image</Label>
				<CourseBadgeUploader courseId={course.id} initialUrl={badgeUrl} />
				<Textarea
					defaultValue={course.description ?? ''}
					placeholder="Describe the course"
					onBlur={(e) =>
						updateCourse(course.id, {
							description: e.target.value,
						})
					}
				/>
			</div>
			<Button
				variant="destructive"
				onClick={async () => {
					if (!confirm('Delete this course and all units/lessons?')) return
					await deleteCourse(course.id)
					router.push(`/${locale}/admin/training/courses`)
					router.refresh()
				}}
			>
				Delete Course
			</Button>

			<UnitsEditor courseId={course.id} units={course.units} />
		</div>
	)
}
