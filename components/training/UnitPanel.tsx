'use client'

import { Card } from '@/components/ui/card'
import { UserCourse } from '@/types/training'
import { LessonCard } from './LessonCard'

export function UnitPanel({
	unit,
	locale,
}: {
	unit: UserCourse['units'][number]
	locale: string
}) {
	return (
		<div className="space-y-3 min-w-0">
			<div className="space-y-1 min-w-0">
				<h2 className="text-xl font-semibold wrap-break-words">{unit.title}</h2>
				<p className="text-sm text-muted-foreground">
					Choose a lesson to continue.
				</p>
			</div>

			<div className="grid gap-3 min-w-0 sm:grid-cols-2 xl:grid-cols-3">
				{unit.lessons.map((lesson) => (
					<LessonCard key={lesson.id} lesson={lesson} locale={locale} />
				))}
			</div>

			{unit.lessons.length === 0 ? (
				<Card className="p-6 text-sm text-muted-foreground">
					No lessons in this unit yet.
				</Card>
			) : null}
		</div>
	)
}
