'use client'

import { UserLesson } from '@/types/training'
import { LessonBlocksRenderer } from './LessonBlocksRenderer'

type Props = {
	lesson: UserLesson
}

export function LessonViewer({ lesson }: Props) {
	return (
		<div className="space-y-6">
			<h1 className="text-xl font-bold">{lesson.title}</h1>
			<LessonBlocksRenderer blocks={lesson.blocks} />
		</div>
	)
}
