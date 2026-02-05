'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserLesson } from '@/types/training'
import { LessonBlocksRenderer } from './LessonBlocksRenderer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toggleLessonCompletion } from '@/app/actions/training'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
	lesson: UserLesson
	locale: string
	courseId?: string | null
	prevLessonId?: string | null
	nextLessonId?: string | null
}

export function LessonViewer({
	lesson,
	locale,
	courseId,
	prevLessonId,
	nextLessonId,
}: Props) {
	const router = useRouter()
	const [done, setDone] = useState(lesson.isCompleted)
	const [saving, setSaving] = useState(false)

	const courseHref = courseId
		? `/${locale}/training/courses/${courseId}`
		: `/${locale}/training`
	const prevHref = prevLessonId
		? `/${locale}/training/lessons/${prevLessonId}`
		: null
	const nextHref = nextLessonId
		? `/${locale}/training/lessons/${nextLessonId}`
		: null

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
				</div>
			</Card>

			<LessonBlocksRenderer blocks={lesson.blocks} />

			<div className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
				<div className="flex flex-wrap items-center justify-between gap-2 p-3">
					<div className="flex flex-wrap items-center gap-2">
						<Button asChild variant="outline">
							<Link href={courseHref}>
								<ChevronLeft className="h-4 w-4" /> Back to course
							</Link>
						</Button>
						{prevHref ? (
							<Button asChild variant="outline">
								<Link href={prevHref} className="flex items-center gap-1">
									<ChevronLeft className="h-4 w-4" />
									Previous
								</Link>
							</Button>
						) : (
							<Button variant="outline" disabled className="gap-1">
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>
						)}
						{nextHref ? (
							<Button asChild variant="outline">
								<Link href={nextHref} className="flex items-center gap-1">
									Next
									<ChevronRight className="h-4 w-4" />
								</Link>
							</Button>
						) : (
							<Button variant="outline" disabled className="gap-1">
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						)}
					</div>

					<Button
						disabled={saving}
						variant={done ? 'destructive' : 'default'}
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
		</div>
	)
}
