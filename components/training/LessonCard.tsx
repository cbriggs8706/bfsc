'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserLesson } from '@/types/training'

export function LessonCard({
	lesson,
	locale,
}: {
	lesson: UserLesson
	locale: string
}) {
	const [done, setDone] = useState(lesson.isCompleted)

	return (
		<Card className="p-4 min-w-0">
			<div className="flex items-start justify-between gap-3 min-w-0">
				{/* LEFT */}
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-2 min-w-0">
						{/* icon */}
						<div className="shrink-0">{/* icon */}</div>

						<Link
							href={`/${locale}/training/lessons/${lesson.id}`}
							className="font-medium hover:underline truncate min-w-0"
						>
							{lesson.title}
						</Link>
					</div>

					<div className="text-xs text-muted-foreground">
						{done ? 'Completed' : 'Not completed'}
					</div>
				</div>

				{/* RIGHT */}
				<div className="flex items-center gap-2 shrink-0">
					<Button asChild variant="secondary">
						<Link href={`/${locale}/training/lessons/${lesson.id}`}>Open</Link>
					</Button>

					<Button /* ... */>
						{done ? 'Mark incomplete' : 'Mark complete'}
					</Button>
				</div>
			</div>
		</Card>
	)
}
