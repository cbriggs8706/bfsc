'use client'

import { UserUnit } from '@/types/training'
import { LessonRow } from './LessonRow'

type Props = {
	unit: UserUnit
	locale: string
}

export function UnitSection({ unit, locale }: Props) {
	return (
		<div className="space-y-2">
			<h2 className="font-semibold">{unit.title}</h2>

			<div className="space-y-1">
				{unit.lessons.map((lesson) => (
					<LessonRow key={lesson.id} lesson={lesson} locale={locale} />
				))}
			</div>
		</div>
	)
}
