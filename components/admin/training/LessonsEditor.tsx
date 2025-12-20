'use client'

import { useState } from 'react'
import { createLesson, deleteLesson } from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LessonBlocksEditor } from './LessonBlocksEditor'
import { AdminLesson } from '@/types/training'
import { useRouter } from 'next/navigation'

type Props = {
	unitId: string
	lessons: AdminLesson[]
}

export function LessonsEditor({ unitId, lessons }: Props) {
	const router = useRouter()

	const [title, setTitle] = useState('')

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Input
					value={title}
					placeholder="New lesson title"
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Button
					onClick={async () => {
						await createLesson({ unitId, title })
						setTitle('')
						router.refresh()
					}}
					disabled={!title}
				>
					Add Lesson
				</Button>
			</div>

			{lessons.map((lesson) => (
				<div key={lesson.id} className="border rounded p-3">
					<div className="flex justify-between items-center mb-2">
						<h5 className="font-medium">{lesson.title}</h5>

						<Button
							size="sm"
							variant="destructive"
							onClick={async () => {
								if (!confirm('Delete this lesson and all blocks?')) return
								await deleteLesson(lesson.id)
								router.refresh()
							}}
						>
							Delete Lesson
						</Button>
					</div>
					<LessonBlocksEditor lessonId={lesson.id} blocks={lesson.blocks} />
				</div>
			))}
		</div>
	)
}
