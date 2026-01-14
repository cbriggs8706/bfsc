'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserLesson } from '@/types/training'
import { LessonBlocksRenderer } from './LessonBlocksRenderer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toggleLessonCompletion } from '@/app/actions/training'
import { CheckCircle2 } from 'lucide-react'

type Props = {
	lesson: UserLesson
	locale: string
}

export function LessonViewer({ lesson, locale }: Props) {
	const router = useRouter()
	const [done, setDone] = useState(lesson.isCompleted)
	const [saving, setSaving] = useState(false)

	return (
		<div className="space-y-4 min-w-0">
			<Card className="p-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
					<div className="min-w-0 space-y-1">
						<h1 className="text-xl font-semibold wrap-break-words">
							{lesson.title}
						</h1>
						<div className="text-sm text-muted-foreground">
							{done ? (
								<span className="inline-flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									Completed
								</span>
							) : (
								'Not completed'
							)}
						</div>
					</div>

					<div className="flex gap-2 shrink-0">
						{/* <Button asChild variant="secondary">
							<Link href={`/${locale}/training`}>Back to courses</Link>
						</Button> */}

						<Button
							disabled={saving}
							variant={done ? 'secondary' : 'default'}
							onClick={async () => {
								const next = !done
								setDone(next) // optimistic
								setSaving(true)
								try {
									await toggleLessonCompletion(lesson.id, next)
								} finally {
									setSaving(false)
									router.refresh()
								}
							}}
						>
							{done ? 'Mark incomplete' : 'Mark complete'}
						</Button>
					</div>
				</div>
			</Card>

			<LessonBlocksRenderer blocks={lesson.blocks} />
		</div>
	)
}
