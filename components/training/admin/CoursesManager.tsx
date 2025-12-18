'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createCourse, deleteCourse } from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdminCourse } from '@/types/training'
import Link from 'next/link'

type Props = {
	courses: Pick<AdminCourse, 'id' | 'title' | 'slug'>[]
	locale: string
}

export function CoursesManager({ courses, locale }: Props) {
	const router = useRouter()
	const [title, setTitle] = useState('')
	const [slug, setSlug] = useState('')

	return (
		<div className="space-y-6">
			<Card className="p-4 space-y-3">
				<h2 className="font-semibold">Create Course</h2>

				<Input
					value={title}
					placeholder="Course title"
					onChange={(e) => setTitle(e.target.value)}
				/>

				<Input
					value={slug}
					placeholder="memories-level-1"
					onChange={(e) => setSlug(e.target.value)}
				/>

				<Button
					onClick={async () => {
						await createCourse({ title, slug })
						setTitle('')
						setSlug('')
						router.refresh() // ✅ THIS IS THE FIX
					}}
					disabled={!title || !slug}
				>
					Create
				</Button>
			</Card>

			<div className="grid gap-4">
				{courses.map((course) => (
					<Card key={course.id} className="p-4">
						<div className="flex justify-between">
							<div>
								<h3 className="font-semibold">{course.title}</h3>
								<p className="text-sm text-muted-foreground">{course.slug}</p>
							</div>

							<div className="flex gap-2">
								<Link href={`/${locale}/admin/training/courses/${course.id}`}>
									<Button variant="default">Edit</Button>
								</Link>

								<Button
									variant="destructive"
									onClick={async () => {
										if (!confirm('Delete this course and ALL its contents?'))
											return
										await deleteCourse(course.id)
										router.refresh()
									}}
								>
									Delete
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	)
}
